const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const MONGO_URL = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'megapixel';
const COLLECTION = 'adStats';
const USERS_COLLECTION = 'users';
const PORT = 3000;
const JWT_SECRET = 'change-cette-valeur-en-production';

const app = express();
app.use(cors());
app.use(express.json());

let dbClient;
async function getDb() {
  if (!dbClient) {
    dbClient = new MongoClient(MONGO_URL);
    await dbClient.connect();
  }
  return dbClient.db(DB_NAME);
}

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
    if (password.length < 6) return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caractères' });

    const db = await getDb();
    const users = db.collection(USERS_COLLECTION);

    const existing = await users.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Un compte existe déjà avec cet email' });

    const passwordHash = await bcrypt.hash(password, 10);
    await users.insertOne({ email: email.toLowerCase(), passwordHash, createdAt: new Date() });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

    const db = await getDb();
    const users = db.collection(USERS_COLLECTION);
    const user = await users.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requis' });

    const db = await getDb();
    const users = db.collection(USERS_COLLECTION);
    const user = await users.findOne({ email: email.toLowerCase() });

    if (user) {
      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000);
      await users.updateOne({ email: user.email }, { $set: { resetToken, resetExpires } });
      console.log(`[Réinitialisation] Code pour ${email} : ${resetToken}`);
    }

    res.json({
      success: true,
      message: "Si un compte existe avec cet email, un code de réinitialisation a été généré (regarde le terminal du serveur pour le récupérer, pas d'email réel envoyé pour l'instant)."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Champs requis' });
    if (password.length < 6) return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caractères' });

    const db = await getDb();
    const users = db.collection(USERS_COLLECTION);
    const user = await users.findOne({ resetToken: token, resetExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: 'Code invalide ou expiré' });

    const passwordHash = await bcrypt.hash(password, 10);
    await users.updateOne(
      { _id: user._id },
      { $set: { passwordHash }, $unset: { resetToken: '', resetExpires: '' } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/dashboard-stats', async (req, res) => {
  try {
    const db = await getDb();
    const collection = db.collection(COLLECTION);

    const { country } = req.query;
    const matchStage = {};
    if (country && country !== 'All') {
      matchStage.country = country;
    }

    const globalStats = await collection.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSpend: { $sum: '$spend' },
          totalImpressions: { $sum: '$impressions' },
          totalClicks: { $sum: '$clicks' },
          dateMin: { $min: '$date' },
          dateMax: { $max: '$date' }
        }
      }
    ]).toArray();

    const dataTotals = globalStats[0] || {
      totalSpend: 0, totalImpressions: 0, totalClicks: 0, dateMin: '', dateMax: ''
    };
    const ctr = dataTotals.totalImpressions > 0 ? (dataTotals.totalClicks / dataTotals.totalImpressions) * 100 : 0;
    const cpc = dataTotals.totalClicks > 0 ? (dataTotals.totalSpend / dataTotals.totalClicks) : 0;

    const platformStats = await collection.aggregate([
      { $match: matchStage },
      { $group: { _id: '$platform', spend: { $sum: '$spend' } } },
      { $sort: { spend: -1 } }
    ]).toArray();
    const platform = platformStats.map((p) => ({ platform: p._id || 'unknown', spend: p.spend }));

    const monthlyStats = await collection.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $substrCP: ['$date', 0, 7] },
          spend: { $sum: '$spend' },
          impressions: { $sum: '$impressions' }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();
    const monthly = monthlyStats.map((m) => ({ month: m._id, spend: m.spend, impressions: m.impressions }));

    const campaignStats = await collection.aggregate([
      { $match: matchStage },
      { $group: { _id: '$campaignName', spend: { $sum: '$spend' } } },
      { $sort: { spend: -1 } },
      { $limit: 10 }
    ]).toArray();
    const topCampaigns = campaignStats.map((c) => ({ campaign: c._id || 'unknown', spend: c.spend }));

    const objectiveStats = await collection.aggregate([
      { $match: matchStage },
      { $group: { _id: '$objective', spend: { $sum: '$spend' } } },
      { $sort: { spend: -1 } }
    ]).toArray();
    const objective = objectiveStats.map((o) => ({ objective: o._id || 'unknown', spend: o.spend }));

    const placementStats = await collection.aggregate([
      { $match: matchStage },
      { $group: { _id: '$placement', spend: { $sum: '$spend' } } },
      { $sort: { spend: -1 } },
      { $limit: 10 }
    ]).toArray();
    const placement = placementStats.map((p) => ({ placement: p._id || 'unknown', spend: p.spend }));

    const dailyStats = await collection.aggregate([
      { $match: matchStage },
      { $group: { _id: '$date', spend: { $sum: '$spend' } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    const daily = dailyStats.map((d) => ({ date: d._id, spend: d.spend }));

    const campaignCount = (await collection.distinct('campaignName', matchStage)).length;

    const countries = await collection.distinct('country');

    res.json({
      totals: {
        spend: dataTotals.totalSpend,
        impressions: dataTotals.totalImpressions,
        clicks: dataTotals.totalClicks,
        ctr,
        cpc,
        campaigns: campaignCount,
        dateMin: dataTotals.dateMin,
        dateMax: dataTotals.dateMax
      },
      platform,
      monthly,
      topCampaigns,
      objective,
      placement,
      daily,
      countriesList: countries.filter(Boolean)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur Serveur MongoDB' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});