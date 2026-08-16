const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGO_URL = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'megapixel';
const USERS_COLLECTION = 'users';

const EMAIL = 'saifedine732@gmail.com';
const PASSWORD = '12345678';

async function run() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(DB_NAME);
  const users = db.collection(USERS_COLLECTION);

  const existing = await users.findOne({ email: EMAIL.toLowerCase() });
  if (existing) {
    console.log('Un compte existe déjà avec cet email. Rien à faire.');
    await client.close();
    return;
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  console.log('HASH GÉNÉRÉ :', passwordHash);
  await users.insertOne({ email: EMAIL.toLowerCase(), passwordHash, createdAt: new Date() });

  console.log(`Compte créé pour ${EMAIL}.`);
  await client.close();
}

run().catch((err) => {
  console.error('Erreur :', err.message);
  process.exit(1);
});