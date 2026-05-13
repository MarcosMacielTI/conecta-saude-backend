# ⚡ QUICK START - Conecta Saúde Backend

## 1️⃣ INSTALAÇÃO (2 minutos)

```bash
cd backend
npm install
```

## 2️⃣ CONFIGURAÇÃO (5 minutos)

Editar `backend/.env`:

```env
MONGO_URI=mongodb+srv://seu_usuario:senha@cluster0.abc.mongodb.net/conecta_saude?retryWrites=true&w=majority
JWT_SECRET=seu_jwt_secret_super_secreto_2024
PORT=3000

# Obter em: https://www.mercadopago.com/settings/credentials
MERCADO_PAGO_ACCESS_TOKEN=APP_USR_xxxxxxxxxxxxx
MERCADO_PAGO_PUBLIC_KEY=APP_USR_xxxxxxx

BACKEND_BASE_URL=http://localhost:3000
```

## 3️⃣ INICIAR SERVIDOR (1 minuto)

```bash
npm run dev
```

**Esperado:**
```
MongoDB connected to mongodb+srv://...
Server running on port 3000
```

---

## 🧪 TESTE IMEDIATO

### Registrar usuário
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "123456",
    "role": "patient"
  }'
```

Copie o `token` da resposta!

### Criar pagamento Pix
```bash
TOKEN=seu_token_aqui

curl -X POST http://localhost:3000/api/payments/create-pix \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "professionalId": "prof_id_qualquer",
    "subscriptionId": "sub_id_qualquer",
    "planName": "Básico",
    "planPrice": 99.90
  }'
```

---

## 📁 ARQUIVOS PRINCIPAIS

| Arquivo | Descrição |
|---------|-----------|
| `index.js` | Servidor principal com Socket.IO |
| `models/Payment.js` | Modelo de pagamento |
| `routes/payments.js` | Endpoints de pagamento |
| `services/paymentService.js` | Lógica Mercado Pago |
| `.env` | Variáveis de ambiente |

---

## 📚 DOCUMENTAÇÃO

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Todos os endpoints
- **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** - Setup detalhado
- **[IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)** - O que foi feito

---

## 🎯 FUNCIONALIDADES IMPLEMENTADAS

### ✅ Autenticação
- Login/Registro com JWT
- Google OAuth preparado

### ✅ Pagamento
- Pix com QR Code
- Cartão de crédito
- Boleto
- Webhook automático
- Ativação de plano

### ✅ Chat em Tempo Real
- Socket.IO configurado
- Verificação de plano
- Indicador de digitação

### ✅ Consultas
- Agendamento com verificação de plano
- Link Jitsi automático
- Status de consulta

### ✅ Controle de Acesso
- Middleware de plano ativo
- Verificação de consultations left
- Bloqueio de acesso sem pagamento

---

## 🚀 PRÓXIMOS PASSOS

1. **Obter credenciais Mercado Pago**
   - Criar conta: https://www.mercadopago.com
   - Ir em Configurações → Credenciais
   - Copiar Access Token

2. **Configurar Webhook**
   - Em Mercado Pago → Webhooks
   - URL: `https://seu-dominio.com/api/payments/webhook`

3. **Conectar Frontend**
   - Usar endpoints de payments para criar planos
   - Conectar Socket.IO para chat
   - Mostrar links de consulta

4. **Deploy**
   - Railway (free): `railway link`
   - Heroku: `git push heroku main`
   - Cloud Run: `gcloud run deploy`

---

## 📞 ENDPOINTS MAIS USADOS

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/auth/register` | Criar conta |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/payments/create-pix` | Pagamento Pix |
| `POST` | `/api/appointments` | Agendar consulta |
| `WS` | `/` | Socket.IO chat |

---

## 💡 DICAS

- Use Postman para testar endpoints
- Use ngrok para webhook local
- Modo sandbox Mercado Pago para testes
- Logs detalhados em `index.js`

---

**Tudo pronto! Backend 100% funcional! 🎉**

Próximo: Conectar com Frontend React Native
