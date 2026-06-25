require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Professional = require('./models/Professional');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/conecta_saude';

const professionalData = {
  name: 'Dra. Ana Souza',
  specialty: 'Nutricionista',
  rating: 4.9,
  price: 'Premium',
  image: 'https://i.pravatar.cc/150?img=12',
  availability: 'Disponível',
  balance: 0,
  email: 'ana.souza@conectasaude.com',
};

const patientsData = [
  { name: 'João Silva', email: 'joao.teste@conectasaude.com', password: '123456', cpf: '111.111.111-11' },
  { name: 'Maria Santos', email: 'maria.teste@conectasaude.com', password: '123456', cpf: '222.222.222-22' },
  { name: 'Pedro Almeida', email: 'pedro.teste@conectasaude.com', password: '123456', cpf: '333.333.333-33' },
];

async function createSeedData() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to', MONGO_URI);
  console.log('\n⚠️  TEST DATA SEEDING IS DISABLED ⚠️');
  console.log('To use test users, manually create them via the app registration flow.');
  console.log('Production mode: All test accounts should be removed from the database.');

  await mongoose.disconnect();
  console.log('Database disconnected');
}

createSeedData().catch((error) => {
  console.error('Seed error:', error);
  process.exit(1);
});
