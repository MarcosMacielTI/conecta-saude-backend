const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Professional = require('./models/Professional');

require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/conecta_saude';

async function createProfessionalUser() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to database');

  try {
    // Verificar se já existe um profissional
    const existingProfessional = await Professional.findOne();
    if (!existingProfessional) {
      console.log('No professional found. Run seed-test-data.js first');
      return;
    }

    // Verificar se já existe usuário profissional
    const existingUser = await User.findOne({ role: 'professional' });
    if (existingUser) {
      console.log('Professional user already exists:', existingUser.email);
      return;
    }

    // Criar usuário profissional
    const hashedPassword = await bcrypt.hash('123456', 10);
    const professionalUser = new User({
      name: 'Dra. Ana Souza',
      email: 'profissional@teste.com',
      password: hashedPassword,
      role: 'professional',
      cpf: '123.456.789-00',
      plan: 'Premium',
      consultationsLeft: 999,
      professionalId: existingProfessional._id,
    });

    await professionalUser.save();
    console.log('Professional user created:');
    console.log('Email: profissional@teste.com');
    console.log('Password: 123456');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createProfessionalUser();