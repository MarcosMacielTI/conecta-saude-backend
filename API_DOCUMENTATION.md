# 📚 API DOCUMENTATION - Conecta Saúde

## 🎯 Overview

Sistema completo de saúde com:
- ✅ Autenticação JWT
- ✅ Integração Mercado Pago (Pix, Cartão, Boleto)
- ✅ Controle de Acesso com Plano Ativo
- ✅ Chat em Tempo Real (Socket.IO)
- ✅ Agendamento de Consultas
- ✅ Vídeo Consulta (Jitsi Meet)
- ✅ Webhooks para Confirmação de Pagamento

---

## 🔐 AUTENTICAÇÃO

### POST /api/auth/register
Criar conta (Paciente ou Profissional)

```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha_segura",
  "role": "patient",
  "cpf": "12345678900"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "user_id",
    "name": "João Silva",
    "email": "joao@example.com",
    "role": "patient"
  }
}
```

### POST /api/auth/login
Fazer login

```json
{
  "email": "joao@example.com",
  "password": "senha_segura"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "user_id",
    "name": "João Silva",
    "plan": null,
    "consultationsLeft": 0
  }
}
```

---

## 💰 PAGAMENTO (MERCADO PAGO)

### 1. POST /api/payments/create-pix
Criar pagamento com Pix e obter QR Code

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "professionalId": "prof_id",
  "subscriptionId": "sub_id",
  "planName": "Básico",
  "planPrice": 99.90,
  "planDuration": "mensal"
}
```

**Response (201):**
```json
{
  "success": true,
  "paymentId": "payment_id",
  "mercadoPagoId": "1234567890",
  "qrCodeData": "00020126580014br.gov.bcb.pix...",
  "qrCodeUrl": "https://api.mercadopago.com/v2/qr_codes/...",
  "expiresAt": "2026-05-13T20:00:00Z",
  "message": "Pagamento criado com sucesso. Escaneie o QR code para pagar."
}
```

### 2. POST /api/payments/create-card
Criar pagamento com Cartão de Crédito/Débito

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "professionalId": "prof_id",
  "subscriptionId": "sub_id",
  "planName": "Intermediário",
  "planPrice": 199.90,
  "token": "card_token_from_frontend",
  "installments": 3
}
```

**Response (201):**
```json
{
  "success": true,
  "paymentId": "payment_id",
  "mercadoPagoId": "1234567890",
  "status": "approved",
  "message": "Pagamento aprovado!"
}
```

### 3. GET /api/payments/{paymentId}
Obter status do pagamento

**Response (200):**
```json
{
  "paymentId": "payment_id",
  "mercadoPagoId": "1234567890",
  "status": "approved",
  "planName": "Básico",
  "planPrice": 99.90,
  "qrCodeUrl": "https://api.mercadopago.com/...",
  "createdAt": "2026-05-12T20:00:00Z"
}
```

### 4. POST /api/payments/{paymentId}/cancel
Cancelar pagamento e solicitar reembolso

**Body (optional):**
```json
{
  "reason": "Cancelamento do plano"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment cancelled successfully"
}
```

### 5. POST /api/payments/webhook
Webhook do Mercado Pago (chamado automaticamente)

**Implementação:**
- Recebe notificação quando pagamento é aprovado
- Ativa automaticamente a subscription
- Atualiza plano do usuário
- Cria conexão com profissional

---

## ✅ FLUXO COMPLETO DE PAGAMENTO

```
1. USUÁRIO ESCOLHE PLANO
   ↓
2. FRONTEND CRIA PAGAMENTO → POST /api/payments/create-pix
   ↓
3. RECEBE QR CODE
   ↓
4. USUÁRIO ESCANEIA E PAGA
   ↓
5. MERCADO PAGO ENVIA WEBHOOK → POST /api/payments/webhook
   ↓
6. BACKEND ATIVA SUBSCRIPTION
   ↓
7. USUÁRIO GANHA ACESSO A CHAT, CONSULTAS E VÍDEO
```

---

## 📅 CONSULTAS (APPOINTMENTS)

### POST /api/appointments
Criar agendamento de consulta (Requer plano ativo)

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "professionalId": "prof_id",
  "date": "2026-05-20",
  "startTime": "14:00",
  "endTime": "15:00"
}
```

**Response (201):**
```json
{
  "_id": "appointment_id",
  "patientId": "patient_id",
  "professionalId": "prof_id",
  "date": "2026-05-20",
  "startTime": "14:00",
  "endTime": "15:00",
  "status": "agendada",
  "videoLink": "https://meet.jit.si/conecta-...",
  "createdAt": "2026-05-12T20:00:00Z"
}
```

### GET /api/appointments
Listar minhas consultas

**Response (200):**
```json
[
  {
    "_id": "appointment_id",
    "date": "2026-05-20",
    "startTime": "14:00",
    "status": "agendada",
    "videoLink": "https://meet.jit.si/..."
  }
]
```

### PUT /api/appointments/{id}
Atualizar status da consulta

**Body:**
```json
{
  "status": "em_andamento",
  "notes": "Paciente relata dor nas costas"
}
```

**Response (200):**
```json
{
  "_id": "appointment_id",
  "status": "em_andamento",
  "notes": "Paciente relata dor nas costas"
}
```

---

## 💬 CHAT EM TEMPO REAL (Socket.IO)

### Conectar ao Socket.IO

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: userToken
  }
});

// Entrar na sala de chat
socket.emit('joinChat', connectionId);

// Ouvir mensagens
socket.on('receiveMessage', (message) => {
  console.log('Nova mensagem:', message);
});

// Enviar mensagem
socket.emit('sendMessage', {
  chatId: connectionId,
  text: 'Olá!'
});

// Indicador de digitação
socket.emit('typing', { chatId: connectionId });
socket.on('userTyping', (data) => {
  console.log(`${data.userName} está digitando...`);
});
```

### POST /api/messages
Enviar mensagem (Requer plano ativo para pacientes)

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "content": "Olá, como você está?",
  "connectionId": "connection_id"
}
```

**Response (201):**
```json
{
  "message": {
    "_id": "message_id",
    "senderId": "user_id",
    "content": "Olá, como você está?",
    "timestamp": "2026-05-12T20:00:00Z"
  }
}
```

### GET /api/messages/{connectionId}
Obter histórico de mensagens

**Response (200):**
```json
[
  {
    "_id": "message_id",
    "senderId": "user_id",
    "content": "Olá!",
    "timestamp": "2026-05-12T19:50:00Z"
  }
]
```

---

## 🎥 VÍDEO CONSULTA (JITSI MEET)

### Fluxo de Vídeo

```
1. CONSULTA AGENDADA
   ↓
2. LINK GERADO AUTOMATICAMENTE
   VideoLink: https://meet.jit.si/conecta-abc123def
   ↓
3. PACIENTE CLICA NO LINK
   ↓
4. PROFISSIONAL INICIA VÍDEO
   ↓
5. AMBOS CONECTADOS
```

### Estrutura da URL

```
https://meet.jit.si/conecta-{prof_id}-{patient_id}-{random}
```

**Opções de Jitsi:**

```javascript
// Iniciar vídeo com nome do usuário
const videoUrl = `${baseLink}?userInfo.displayName=${encodeURIComponent(userName)}`;

// Abrir em nova aba
window.open(videoUrl, '_blank');

// Incorporar em iframe
<iframe 
  src={videoUrl}
  allow="camera; microphone; fullscreen; display-capture"
  style={{width: '100%', height: '100%'}}
/>
```

---

## 🔒 MIDDLEWARE DE VERIFICAÇÃO DE PLANO

### Proteção de Rotas

```javascript
// Verificar se usuário tem plano ativo
router.post('/chat/send', verifyActivePlan, async (req, res) => {
  // Apenas usuários com plano ativo podem acessar
});

// Verificar se paciente (profissionais sempre podem acessar)
router.post('/consultation', verifyPatient, async (req, res) => {
  // Apenas pacientes
});

// Verificar se profissional
router.get('/earnings', verifyProfessional, async (req, res) => {
  // Apenas profissionais
});
```

### Códigos de Erro

```json
{
  "error": "Active plan required to chat",
  "code": "NO_PLAN"
}
```

```json
{
  "error": "No consultations left in your plan",
  "code": "NO_CONSULTATIONS_LEFT"
}
```

---

## 📊 MODELOS DE DADOS

### User
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (bcrypt),
  cpf: String (unique, sparse),
  role: 'patient' | 'professional',
  plan: String (null | 'Básico' | 'Intermediário' | 'Premium'),
  consultationsLeft: Number,
  professionalId: ObjectId,
  createdAt: Date
}
```

### Payment
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  professionalId: ObjectId,
  subscriptionId: ObjectId,
  planName: String,
  planPrice: Number,
  paymentMethod: 'pix' | 'credit_card' | 'debit_card' | 'boleto',
  mercadoPagoId: String,
  mercadoPagoStatus: 'pending' | 'approved' | 'rejected',
  qrCodeData: String,
  qrCodeUrl: String,
  approvedAt: Date,
  createdAt: Date
}
```

### Appointment
```javascript
{
  _id: ObjectId,
  patientId: ObjectId,
  professionalId: ObjectId,
  date: String,
  startTime: String,
  endTime: String,
  status: 'agendada' | 'em_andamento' | 'finalizada' | 'cancelada',
  videoLink: String,
  notes: String,
  createdAt: Date
}
```

---

## 🧪 EXEMPLOS DE USO (cURL)

### 1. Registrar usuário
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

### 2. Criar pagamento Pix
```bash
curl -X POST http://localhost:3000/api/payments/create-pix \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "professionalId": "prof_id",
    "subscriptionId": "sub_id",
    "planName": "Básico",
    "planPrice": 99.90
  }'
```

### 3. Agendar consulta
```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "professionalId": "prof_id",
    "date": "2026-05-20",
    "startTime": "14:00",
    "endTime": "15:00"
  }'
```

---

## 🚀 CONFIGURAÇÃO MERCADO PAGO

### 1. Obter Credenciais
- Ir em https://www.mercadopago.com
- Criar conta de negócio
- Ir para Configurações → Credenciais
- Copiar **Access Token** e **Public Key**

### 2. Adicionar ao .env
```env
MERCADO_PAGO_ACCESS_TOKEN=seu_token_aqui
MERCADO_PAGO_PUBLIC_KEY=sua_public_key_aqui
MERCADO_PAGO_WEBHOOK_SECRET=seu_webhook_secret
BACKEND_BASE_URL=https://seu-dominio.com
```

### 3. Configurar Webhook
- Em Configurações → Webhooks
- URL: `https://seu-backend.com/api/payments/webhook`
- Eventos: `payment.created`, `payment.updated`

---

## ⚠️ REGRAS IMPORTANTES

1. **Pagamento é obrigatório**
   - Nenhum chat ou consulta sem plano ativo
   - Verificado em cada requisição

2. **Webhook é crítico**
   - Sempre responde com status 200
   - Ativa plano automaticamente

3. **Segurança**
   - Tokens expiram em 1 hora
   - Sempre usar HTTPS em produção
   - Nunca exponha a chave secreta JWT

4. **Vídeo**
   - Links expiram após 24h de inatividade
   - Usar Jitsi gratuitamente
   - Selfhosting é opção para produção

---

## 📱 TESTE NO FRONTEND

```javascript
// JavaScript/React exemplo
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    Authorization: `Bearer ${token}`
  }
});

// Criar pagamento
const response = await api.post('/payments/create-pix', {
  professionalId: 'prof_id',
  subscriptionId: 'sub_id',
  planName: 'Básico',
  planPrice: 99.90
});

console.log('QR Code URL:', response.data.qrCodeUrl);
```

---

## 🆘 TROUBLESHOOTING

### Erro: "No active plan"
- Usuário precisa fazer pagamento
- Verificar se webhook foi recebido

### Erro: "Invalid token"
- Token expirou (válido por 1h)
- Fazer novo login

### Erro: "Payment not found"
- Verificar paymentId enviado
- Confirmar que pagamento foi criado

### Webhook não funciona
- Verificar URL em Mercado Pago
- Confirmar que backend está rodando
- Checar logs de erro

---

## 📞 SUPORTE

Para dúvidas ou bugs:
- GitHub Issues: [project/issues](https://github.com/)
- Email: suporte@conectasaude.com
- Whatsapp: [número]

---

**Última atualização:** 12/05/2026
**Versão API:** 1.0.0
