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

  const professional = await Professional.findOne() || new Professional(professionalData);
  if (!professional._id) {
    await professional.save();
    console.log(`Professional created: ${professional.name}`);
  } else {
    console.log(`Existing professional found: ${professional.name}`);
  }

  const patientIds = [];
  for (const patient of patientsData) {
    const existingPatient = await User.findOne({ email: patient.email });
    if (existingPatient) {
      if (!existingPatient.professionalId) {
        existingPatient.professionalId = professional._id;
        await existingPatient.save();
      }
      patientIds.push(existingPatient._id);
      console.log(`Existing patient preserved: ${existingPatient.email}`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(patient.password, 10);
    const newPatient = new User({
      name: patient.name,
      email: patient.email,
      password: hashedPassword,
      role: 'patient',
      cpf: patient.cpf,
      plan: null,
      consultationsLeft: 0,
      professionalId: professional._id,
    });
    await newPatient.save();
    patientIds.push(newPatient._id);
    console.log(`Created patient: ${newPatient.email}`);
  }

  await Professional.findByIdAndUpdate(professional._id, {
    $addToSet: { clients: { $each: patientIds } },
  });

  console.log('\n=== Dados de teste criados ===');
  console.log('Profissional:');
  console.log(`- Email: ${professionalData.email || 'não disponível'} | Senha: (use seu login de profissional no app)`);
  console.log('\nPacientes:');
  patientsData.forEach((patient) => {
    console.log(`- ${patient.email} | senha: ${patient.password}`);
  });

  await mongoose.disconnect();
  console.log('Database disconnected');
}

createSeedData().catch((error) => {
  console.error('Seed error:', error);
  process.exit(1);
});
