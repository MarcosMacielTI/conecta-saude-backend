// Alternativa: Script para deletar usuários de teste usando a conexão atual
// Use este script se o MongoDB local não estiver disponível
// Execute via mongosh:
// mongosh
// use conecta_saude
// (copie e cole as linhas abaixo)

db.users.deleteMany({ email: { $in: [
  'test@example.com',
  'test2@example.com', 
  'test16@example.com',
  'test@test.com',
  'joao@example.com',
  'joao2@test.com',
  'joao5@test.com',
  'joao.teste@conectasaude.com',
  'maria.teste@conectasaude.com',
  'pedro.teste@conectasaude.com'
]}});

db.users.deleteMany({ name: { $regex: /^(Test User|João Silva|Maria Santos|Pedro Almeida|Test)$/i }});

db.users.countDocuments();  // Verificar quantos usuários restaram
