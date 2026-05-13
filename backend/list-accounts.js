const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/conecta_saude')
  .then(async () => {
    const Professional = require('./models/Professional');
    const User = require('./models/User');
    
    console.log('=== PROFISSIONAIS ===');
    const profs = await Professional.find().select('name email specialty');
    console.log('Total:', profs.length);
    profs.forEach(p => console.log('  -', p.name, '|', p.email, '|', p.specialty));
    
    console.log('\n=== PACIENTES ===');
    const users = await User.find({ role: 'patient' }).select('name email plan professionalId');
    console.log('Total:', users.length);
    users.forEach(u => console.log('  -', u.name, '|', u.email, '| Plano:', u.plan, '| Prof ID:', u.professionalId));
    
    mongoose.disconnect();
  })
  .catch(e => {
    console.error('Erro:', e.message);
    mongoose.disconnect();
  });
