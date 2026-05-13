const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/conecta_saude')
  .then(async () => {
    const Professional = require('./models/Professional');
    
    const newProf = await Professional.create({
      name: 'Ariana Lopes Maciel',
      email: 'marcos.ciesa2025@gmail.com',
      specialty: 'Nutricionista',
      price: 'Profissional Experiente',
      rating: 5,
      availability: 'Segunda a Sexta',
      clients: [],
      balance: 0
    });
    
    console.log('✅ Profissional criado:');
    console.log('  Nome:', newProf.name);
    console.log('  Email:', newProf.email);
    console.log('  ID:', newProf._id);
    mongoose.disconnect();
  })
  .catch(e => {
    console.error('❌ Erro:', e.message);
    mongoose.disconnect();
  });
