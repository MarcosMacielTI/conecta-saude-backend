require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/conecta_saude';

const testEmails = [
  'test@example.com',
  'test2@example.com',
  'test16@example.com',
  'test@test.com',
  'joao@example.com',
  'joao2@test.com',
  'joao5@test.com',
  'joao.teste@conectasaude.com',
  'maria.teste@conectasaude.com',
  'pedro.teste@conectasaude.com',
];

async function cleanupTestUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Conectado ao banco em:', MONGO_URI);

    for (const email of testEmails) {
      const result = await User.deleteMany({ email: email.toLowerCase() });
      if (result.deletedCount > 0) {
        console.log(`✓ Deletado(s) ${result.deletedCount} usuário(s) com email: ${email}`);
      }
    }

    // Also delete by name patterns
    const namePatterns = ['Test User', 'João Silva', 'Maria Santos', 'Pedro Almeida', 'Test'];
    for (const pattern of namePatterns) {
      const result = await User.deleteMany({ name: new RegExp(pattern, 'i') });
      if (result.deletedCount > 0) {
        console.log(`✓ Deletado(s) ${result.deletedCount} usuário(s) com nome parecido com: ${pattern}`);
      }
    }

    const remaining = await User.countDocuments();
    console.log(`\n✓ Limpeza concluída! Usuários restantes: ${remaining}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Erro ao limpar dados de teste:', error);
    process.exit(1);
  }
}

cleanupTestUsers();
