const fs = require('node:fs');
const path = require('node:path');
const { MongoClient } = require('mongodb'); 

const CSV_PATH = path.join(__dirname, 'OU.csv');
const MONGO_URL = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'megapixel';
const COLLECTION = 'adStats';

function parseCsvLine(line) {
  const tableau = [];
  let current = '';
  let interrupteur  = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (interrupteur && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        interrupteur = !interrupteur;
      }
    } else if (char === ',' && !interrupteur) {
      tableau.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  tableau.push(current);
  return tableau ;
}

function loadCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((h, i) => (row[h] = values[i]));
    return row;
  });
  return rows;
}
function toDocument(r) {
  return {
    date: r['Date'],
    country: r['Pays'],
    region: r['Région'],
    platform: r['Plateforme'],
    placement: r['Placement'],
    devicePlatform: r['Plateforme de l’appareil'],
    accountName: r['Nom du compte'],
    campaignId: r['ID de campagne'],
    campaignName: r['Nom de la campagne'],
    adsetName: r['Nom de l’ensemble de publicités'],
    objective: r['Objectif'],
    mediaType: r['Type de contenu multimédia'],
    impressions: parseInt(r['Impressions'], 10) || 0,
    spend: parseFloat(r['Montant dépensé (USD)']) || 0,
  };
}

async function run() {
  console.log('Lecture du CSV');
  const rows = loadCsv(CSV_PATH);
  console.log(`${rows.length} lignes trouvées.`);
  const docs = rows.map(toDocument);

  console.log('Connexion à MongoDB');
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION);

  await collection.deleteMany({});

  const BATCH_SIZE = 5000;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    await collection.insertMany(batch);
    console.log(`  ${Math.min(i + BATCH_SIZE, docs.length)} / ${docs.length} lignes insérées`);
  }

  await collection.createIndex({ date: 1 });
  await collection.createIndex({ platform: 1 });
  await collection.createIndex({ campaignId: 1 });

  const count = await collection.countDocuments();
  console.log(`Import terminé : ${count} documents dans la collection "${COLLECTION}".`);

  await client.close();
}

run().catch((err) => {
  console.error("Erreur pendant l'import :", err.message);
  process.exit(1);
});