# 🎯 IMPLEMENTATION CHECKLIST - Conecta Saúde

## ✅ COMPLETO (BACKEND)

### 🔐 Autenticação
- [x] POST `/api/auth/register` - Criar conta (Paciente ou Profissional)
- [x] POST `/api/auth/login` - Fazer login com JWT
- [x] Middleware JWT com verificação de token
- [x] Bcrypt para hash de senha
- [x] Google OAuth preparado (credenciais no .env)

### 💰 Pagamento (Mercado Pago)
- [x] POST `/api/payments/create-pix` - Criar pagamento Pix com QR Code
- [x] POST `/api/payments/create-card` - Criar pagamento cartão de crédito/débito
- [x] GET `/api/payments/:paymentId` - Obter status do pagamento
- [x] POST `/api/payments/:paymentId/cancel` - Cancelar pagamento
- [x] GET `/api/payments` - Histórico de pagamentos
- [x] POST `/api/payments/webhook` - Webhook Mercado Pago
- [x] Payment Model com campos completos
- [x] PaymentService com integração completa
- [x] Ativação automática de subscription após pagamento aprovado

### 🛡️ Controle de Acesso (Middlewares)
- [x] `verifyToken` - Verificar JWT
- [x] `verifyActivePlan` - Bloquear acesso sem plano
- [x] `verifyConsultationsLeft` - Verificar consultas restantes
- [x] `verifyProfessional` - Apenas profissionais
- [x] `verifyPatient` - Apenas pacientes
- [x] `getPlanInfo` - Obter informações do plano

### 📅 Consultas (Appointments)
- [x] POST `/api/appointments` - Criar consulta (com verificação de plano)
- [x] GET `/api/appointments` - Listar minhas consultas
- [x] PUT `/api/appointments/:id` - Atualizar status
- [x] Geração automática de link Jitsi
- [x] Verificação de consultations left
- [x] Appointment Model atualizado com videoLink

### 💬 Chat em Tempo Real (Socket.IO)
- [x] Conexão autenticada com token
- [x] `joinChat` - Entrar na sala de chat
- [x] `sendMessage` - Enviar mensagem (com verificação de plano)
- [x] `receiveMessage` - Receber mensagens em tempo real
- [x] `typing` - Indicador de digitação
- [x] `stopTyping` - Parar digitação
- [x] `leaveChat` - Sair da sala
- [x] Verificação de plano ativo para pacientes
- [x] POST `/api/messages` - Enviar mensagem HTTP
- [x] GET `/api/messages/:connectionId` - Histórico

### 🎥 Vídeo Consulta (Jitsi Meet)
- [x] Geração automática de links únicos
- [x] VideoService com funções auxiliares
- [x] Embed code para iframe
- [x] Links de acesso para paciente e profissional
- [x] Integração com Appointments

### 📊 Profissionais
- [x] GET `/api/professionals` - Listar todos
- [x] GET `/api/professionals/professional` - Padrão para pacientes
- [x] GET `/api/professionals/:id` - Profissional específico
- [x] Professional Model com campos completos

### 👥 Usuários
- [x] GET `/api/users/profile` - Perfil do usuário
- [x] PUT `/api/users/profile` - Atualizar perfil
- [x] User Model com plan e consultationsLeft

### 🔗 Conexões
- [x] GET `/api/conversation` - Obter conexão com profissional
- [x] Connection Model para rastrear relações

### 🏥 Subscriptions
- [x] POST `/api/subscriptions` - Criar subscription
- [x] GET `/api/subscriptions` - Listar minhas subscriptions
- [x] Mapeamento de planos → consultas (Básico=1, Inter=2, Premium=3)

### 📁 Estrutura do Projeto
- [x] `/models` - Todos os modelos MongoDB
- [x] `/routes` - Todas as rotas da API
- [x] `/services` - PaymentService e VideoService
- [x] `/middlewares` - Middlewares de autenticação e verificação
- [x] `.env` - Configurações com Mercado Pago
- [x] `package.json` - Dependências (mercadopago adicionado)
- [x] `index.js` - Server principal com Socket.IO melhorado

---

## ⏳ TODO (Próximos Passos)

### 🚀 Deployment
- [ ] Fazer deploy do backend no Railway (free tier)
- [ ] Atualizar `BACKEND_BASE_URL` no .env
- [ ] Configurar webhook do Mercado Pago na URL pública
- [ ] Testar fluxo completo em produção

### 📱 Frontend (React Native)
- [ ] Implementar PlansScreen com integração de pagamento
- [ ] Conectar Socket.IO no ChatScreen
- [ ] Implementar video link no AppointmentScreen
- [ ] Adicionar lógica de verificação de plano em cada tela

### 💳 Mercado Pago
- [ ] Obter Access Token e Public Key
- [ ] Configurar Credenciais no .env
- [ ] Configurar Webhook em Mercado Pago
- [ ] Testar com contas de teste (modo sandbox)

### 🔐 Segurança
- [ ] Adicionar rate limiting
- [ ] HTTPS em produção
- [ ] CORS específico para domínio frontend
- [ ] Validação de email
- [ ] Autenticação 2FA

### 📊 Monitoramento
- [ ] Configurar logs estruturados
- [ ] Adicionar health checks
- [ ] Monitorar webhooks
- [ ] Dashboard de pagamentos

### ✨ Melhorias
- [ ] Notificações push
- [ ] Renovação automática de planos
- [ ] Dashboard do profissional
- [ ] Avaliação de pacientes
- [ ] Upload de documentos
- [ ] Histórico de consultas

---

## 📈 ESTATÍSTICAS

### Arquivos Criados/Modificados
- Models: 8 (User, Professional, Subscription, Appointment, Payment, Message, Connection, Chat)
- Routes: 7 (auth, professionals, users, subscriptions, appointments, payments, messages)
- Services: 2 (paymentService, videoService)
- Middlewares: 1 (authMiddleware)
- Documentação: 2 (API_DOCUMENTATION.md, IMPLEMENTATION_CHECKLIST.md)

### Endpoints Implementados
- Auth: 2 (register, login)
- Payments: 6 (create-pix, create-card, get, cancel, webhook, list)
- Appointments: 3 (create, list, update)
- Messages: 3 (send, get history, conversation)
- Professionals: 4 (list, default, by ID, patients)
- Subscriptions: 2 (create, list)

**Total: 22 Endpoints + Socket.IO**

---

## 🧪 TESTE RÁPIDO

### 1. Testar Auth
```bash
# Registrar
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"123","role":"patient"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123"}'
```

### 2. Testar Pagamento
```bash
curl -X POST http://localhost:3000/api/payments/create-pix \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "professionalId":"prof_id",
    "subscriptionId":"sub_id",
    "planName":"Básico",
    "planPrice":99.90
  }'
```

### 3. Testar Socket.IO
```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000', {
  auth: { token: 'your_token' }
});
socket.emit('joinChat', 'chat_id');
socket.emit('sendMessage', { chatId: 'chat_id', text: 'Hello' });
```

---

## 📝 NOTAS IMPORTANTES

### Mercado Pago
- Usar modo sandbox para testes
- Access Token pode ser obtido em https://www.mercadopago.com/settings/credentials
- Webhook precisa de URL pública (usar ngrok para testes locais)

### Socket.IO
- Pacientes precisam de plano ativo para enviar mensagens
- Profissionais sempre podem acessar
- Verificação de token na conexão

### Vídeo
- Jitsi Meet é gratuito e open-source
- Links expiram após 24h de inatividade
- Possibilidade de selfhosting para produção

### Segurança
- JWT expira em 1 hora
- Senhas com bcrypt (10 rounds)
- CORS configurado
- Headers de segurança recomendados

---

## 🔗 REFERÊNCIAS

- [Mercado Pago Docs](https://developer.mercadopago.com)
- [Socket.IO Docs](https://socket.io/docs/)
- [Jitsi Meet](https://jitsi.org/jitsi-meet/)
- [Mongoose Docs](https://mongoosejs.com/)

---

## 📞 CONTATO

Para dúvidas sobre implementação ou próximos passos, consulte a API_DOCUMENTATION.md ou entre em contato com o time.

**Status:** ✅ Backend Completo  
**Data:** 12/05/2026  
**Versão:** 1.0.0
