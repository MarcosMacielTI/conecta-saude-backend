# 🚀 BACKEND SETUP - Conecta Saúde

## 📋 Pré-requisitos

- [x] Node.js 14+ instalado
- [x] MongoDB Atlas ou local configurado
- [x] npm ou yarn
- [x] Conta Mercado Pago

---

## ⚙️ CONFIGURAÇÃO INICIAL

### 1. Instalar Dependências

```bash
cd backend
npm install
```

**Dependências instaladas:**
- express 4.22.1
- mongoose 9.4.1
- jsonwebtoken 9.0.3
- bcryptjs 3.0.3
- dotenv 17.4.2
- socket.io 4.7.5
- mercadopago 2.3.0
- cors 2.8.6

### 2. Configurar Variáveis de Ambiente

Editar arquivo `.env`:

```bash
# Database
MONGO_URI=mongodb+srv://seu_usuario:sua_senha@cluster.mongodb.net/conecta_saude

# JWT
JWT_SECRET=seu_jwt_secret_super_secreto_2024

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_secret

# Server
PORT=3000

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=seu_access_token_aqui
MERCADO_PAGO_PUBLIC_KEY=sua_public_key_aqui
MERCADO_PAGO_WEBHOOK_SECRET=seu_webhook_secret_aqui

# Backend URL (para webhooks)
BACKEND_BASE_URL=http://localhost:3000
```

---

## 🏦 CONFIGURAR MERCADO PAGO

### Passo 1: Criar Conta

1. Ir em https://www.mercadopago.com
2. Clique em "Criar Conta"
3. Selecione "Sou um vendedor"
4. Preencha os dados

### Passo 2: Obter Credenciais

1. Faça login em https://www.mercadopago.com
2. Vá em **Configurações** → **Credenciais**
3. Copie:
   - **Access Token** → `MERCADO_PAGO_ACCESS_TOKEN`
   - **Public Key** → `MERCADO_PAGO_PUBLIC_KEY`

### Passo 3: Configurar Webhook

1. Em **Configurações** → **Webhooks**
2. Clique em **+ Adicionar Webhook**
3. Configure:
   - **URL:** `http://localhost:3000/api/payments/webhook` (local)
   - **URL (produção):** `https://seu-dominio.com/api/payments/webhook`
4. **Eventos:**
   - ✅ payment.created
   - ✅ payment.updated
5. Clique em **Salvar**

**Nota:** Para testes locais, use [ngrok](https://ngrok.com/) para criar URL pública:
```bash
ngrok http 3000
# Copie a URL: https://abc123.ngrok.io
# Use: https://abc123.ngrok.io/api/payments/webhook
```

### Passo 4: Teste com Modo Sandbox

1. Em **Configurações** → **Modo de teste/produção**
2. Ative **Modo de teste**
3. Use credenciais de teste

**Dados de teste:**
- Email: `test_user_123456@testuser.com`
- Senha: `12345678`

---

## 🗄️ CONFIGURAR MONGODB

### Opção A: MongoDB Atlas (Recomendado)

1. Ir em https://www.mongodb.com/cloud/atlas
2. Criar conta
3. Criar novo projeto
4. Criar cluster
5. Ir em **Connect** → **Drivers** → **Node.js**
6. Copiar string de conexão:
   ```
   mongodb+srv://usuario:senha@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```
7. Adicionar em `.env`:
   ```
   MONGO_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/conecta_saude?retryWrites=true&w=majority
   ```

### Opção B: MongoDB Local

1. Instalar MongoDB Community Edition
2. Iniciar serviço MongoDB
3. Em `.env`:
   ```
   MONGO_URI=mongodb://localhost:27017/conecta_saude
   ```

---

## 🚀 INICIAR SERVIDOR

### Modo Desenvolvimento

```bash
npm run dev
```

**Esperado:**
```
MongoDB connected to mongodb+srv://...
Server running on port 3000
```

### Teste de Health Check

```bash
curl http://localhost:3000/health
```

**Resposta esperada:**
```json
{
  "status": "OK",
  "timestamp": "2026-05-12T20:00:00.000Z",
  "uptime": 123.45,
  "database": "connected"
}
```

---

## 🧪 TESTE BÁSICO DA API

### 1. Registrar Usuário

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123",
    "role": "patient"
  }'
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "user_id",
    "name": "João Silva",
    "email": "joao@example.com"
  }
}
```

**Salve o token para próximos testes!**

### 2. Criar Profissional

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dra. Maria",
    "email": "maria@example.com",
    "password": "senha123",
    "role": "professional",
    "specialty": "Nutricionista"
  }'
```

### 3. Listar Profissionais

```bash
curl http://localhost:3000/api/professionals
```

**Resposta:**
```json
[
  {
    "_id": "prof_id",
    "name": "Dra. Maria",
    "email": "maria@example.com",
    "specialty": "Nutricionista"
  }
]
```

### 4. Criar Pagamento Pix

```bash
curl -X POST http://localhost:3000/api/payments/create-pix \
  -H "Authorization: Bearer {SEU_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "professionalId": "prof_id",
    "subscriptionId": "sub_id_qualquer",
    "planName": "Básico",
    "planPrice": 99.90
  }'
```

**Resposta:**
```json
{
  "success": true,
  "paymentId": "payment_id",
  "qrCodeUrl": "https://api.mercadopago.com/...",
  "qrCodeData": "00020126580014br.gov.bcb.pix...",
  "message": "Pagamento criado com sucesso"
}
```

---

## 📱 TESTAR SOCKET.IO (Chat)

### Opção 1: Node.js

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
  auth: {
    token: 'seu_token_jwt'
  }
});

// Conectar
socket.on('connect', () => {
  console.log('Conectado ao servidor');
  
  // Entrar no chat
  socket.emit('joinChat', 'chat_room_id');
});

// Receber mensagem
socket.on('receiveMessage', (message) => {
  console.log('Mensagem recebida:', message);
});

// Enviar mensagem
socket.emit('sendMessage', {
  chatId: 'chat_room_id',
  text: 'Olá!'
});

// Erro
socket.on('error', (error) => {
  console.error('Erro:', error);
});
```

### Opção 2: HTML/JavaScript

```html
<script src="https://cdn.socket.io/4.7.0/socket.io.min.js"></script>
<script>
  const socket = io('http://localhost:3000', {
    auth: {
      token: 'seu_token_jwt'
    }
  });
  
  socket.emit('joinChat', 'chat_id');
  socket.emit('sendMessage', { chatId: 'chat_id', text: 'Oi' });
</script>
```

---

## 🔧 TROUBLESHOOTING

### Erro: "MONGO_URI not defined"
- Verifique se `.env` existe
- Confirme se `MONGO_URI` está preenchida
- Restart servidor

### Erro: "Cannot find module 'mercadopago'"
```bash
npm install mercadopago
```

### Erro: "Port 3000 already in use"
```bash
# Encontre o processo
lsof -i :3000

# Mate o processo
kill -9 <PID>

# Ou use outra porta
PORT=3001 npm run dev
```

### Webhook não funciona
1. Verifique URL em Mercado Pago
2. Use ngrok para testes locais
3. Confirme que servidor está rodando
4. Verifique logs do servidor

### MongoDB connection timeout
- Confirme MONGO_URI está correta
- Verifique whitelist de IP em Atlas
- Teste com `mongo` CLI

---

## 📊 ESTRUTURA DE PASTAS

```
backend/
├── models/
│   ├── User.js
│   ├── Professional.js
│   ├── Payment.js
│   ├── Subscription.js
│   ├── Appointment.js
│   ├── Message.js
│   ├── Connection.js
│   └── Chat.js
├── routes/
│   ├── auth.js
│   ├── payments.js
│   ├── appointments.js
│   ├── messages.js
│   ├── professionals.js
│   ├── subscriptions.js
│   └── users.js
├── services/
│   ├── paymentService.js
│   └── videoService.js
├── middlewares/
│   └── authMiddleware.js
├── index.js (servidor principal)
├── .env (configurações)
├── package.json
└── README.md
```

---

## ✅ CHECKLIST DE SETUP

- [ ] Node.js instalado (`node -v`)
- [ ] npm instalado (`npm -v`)
- [ ] MongoDB Atlas/local configurado
- [ ] `.env` preenchido com todas as variáveis
- [ ] Dependências instaladas (`npm install`)
- [ ] Conta Mercado Pago criada
- [ ] Access Token do Mercado Pago obtido
- [ ] Webhook configurado
- [ ] Servidor rodando (`npm run dev`)
- [ ] Health check funcionando
- [ ] Teste de registro bem-sucedido
- [ ] Teste de pagamento bem-sucedido

---

## 📝 PRÓXIMOS PASSOS

1. **Testar API completa** - Use Postman ou similar
2. **Configurar Frontend** - Conectar React Native ao backend
3. **Deploy** - Colocar em produção (Railway, Heroku, etc)
4. **Monitoramento** - Configurar logs e alertas

---

## 🔗 RECURSOS

- [Documentação da API](./API_DOCUMENTATION.md)
- [Checklist de Implementação](./IMPLEMENTATION_CHECKLIST.md)
- [Mercado Pago Docs](https://developer.mercadopago.com)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

**Status:** ✅ Pronto para usar  
**Versão:** 1.0.0  
**Data:** 12/05/2026
