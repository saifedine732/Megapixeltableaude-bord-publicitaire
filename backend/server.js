const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const MONGO_URL = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'megapixel';
const COLLECTION = 'adStats';
const PORT = 3000;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/dashboard-stats', async (req, res) => {
  let client;
  try {
    client = new MongoClient(MONGO_URL);
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION);

    const { country } = req.query;
    const matchStage = {};
    if (country && country !== 'All') {
      matchStage.country = country;
    }

    // 1. KPIs globaux + dates min/max
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

    // 2. Dépense par plateforme (pour le Doughnut)
    const platformStats = await collection.aggregate([
      { $match: matchStage },
      { $group: { _id: '$platform', spend: { $sum: '$spend' } } },
      { $sort: { spend: -1 } }
    ]).toArray();
    const platform = platformStats.map((p) => ({ platform: p._id || 'unknown', spend: p.spend }));

    // 3. Dépense par mois (pour TrendChart) — on prend les 7 premiers caractères de la date "YYYY-MM"
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

    // 4. Top 10 campagnes par dépense
    const campaignStats = await collection.aggregate([
      { $match: matchStage },
      { $group: { _id: '$campaignName', spend: { $sum: '$spend' } } },
      { $sort: { spend: -1 } },
      { $limit: 10 }
    ]).toArray();
    const topCampaigns = campaignStats.map((c) => ({ campaign: c._id || 'unknown', spend: c.spend }));

    // 5. Dépense par objectif de campagne
    const objectiveStats = await collection.aggregate([
      { $match: matchStage },
      { $group: { _id: '$objective', spend: { $sum: '$spend' } } },
      { $sort: { spend: -1 } }
    ]).toArray();
    const objective = objectiveStats.map((o) => ({ objective: o._id || 'unknown', spend: o.spend }));

    // 6. Dépense par emplacement publicitaire
    const placementStats = await collection.aggregate([
      { $match: matchStage },
      { $group: { _id: '$placement', spend: { $sum: '$spend' } } },
      { $sort: { spend: -1 } },
      { $limit: 10 }
    ]).toArray();
    const placement = placementStats.map((p) => ({ placement: p._id || 'unknown', spend: p.spend }));

    // 7. Dépense quotidienne (pour DailyChart)
    const dailyStats = await collection.aggregate([
      { $match: matchStage },
      { $group: { _id: '$date', spend: { $sum: '$spend' } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    const daily = dailyStats.map((d) => ({ date: d._id, spend: d.spend }));

 

   // 8. Nombre de campagnes distinctes
    const campaignCount = (await collection.distinct('campaignName', matchStage)).length;

    // 9. Liste des pays (pour le filtre déroulant)
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
  } finally {
    if (client) await client.close();
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});