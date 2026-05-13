# 🔒 GUIA COMPLETO DE SEGURANÇA - Conecta Saúde

## 📋 Índice
1. [Arquitetura de Segurança](#arquitetura)
2. [Encriptação de Dados](#encriptação)
3. [Proteção de Dados Sensíveis](#proteção)
4. [Sistema de Auditoria](#auditoria)
5. [Repasse Integro (100%)](#repasse)
6. [Conformidade LGPD/GDPR](#lgpd)
7. [Proteção contra Vulnerabilidades](#vulnerabilidades)
8. [Configuração de Segurança](#configuração)

---

## 🏗️ Arquitetura de Segurança {#arquitetura}

### Camadas de Proteção

```
┌─────────────────────────────────────┐
│  1. HTTPS + CORS + CSP              │
│     (Transport Layer Security)      │
├─────────────────────────────────────┤
│  2. Rate Limiting + CSRF            │
│     (Attack Prevention)             │
├─────────────────────────────────────┤
│  3. JWT Authentication              │
│     (User Verification)             │
├─────────────────────────────────────┤
│  4. Encryption (AES-256-GCM)        │
│     (Data Protection)               │
├─────────────────────────────────────┤
│  5. Input Validation + Sanitization │
│     (Injection Prevention)          │
├─────────────────────────────────────┤
│  6. Audit Logging                   │
│     (Compliance & Detection)        │
└─────────────────────────────────────┘
```

---

## 🔐 Encriptação de Dados {#encriptação}

### Campos Encriptados

| Campo | Algoritmo | Motivo |
|-------|-----------|--------|
| CPF | AES-256-GCM | Dado pessoal sensível |
| Documentos | AES-256-GCM | Privacidade do paciente |
| Dados de pagamento | Mercado Pago Vault | PCI DSS compliant |

### Como Funciona

**Arquivo**: `backend/services/encryptionService.js`

```javascript
// Encriptar
const encryption = new EncryptionService();
const encrypted = encryption.encrypt('12345678900');
// Resultado: "iv_hex:authTag_hex:encrypted_hex"

// Descriptografar
const decrypted = encryption.decrypt(encrypted);
// Resultado: "12345678900"

// Hash (one-way, para verificação)
const hash = encryption.hash('12345678900');
// Resultado: "sha256_hash..."
```

### Instalação da Chave

1. **Gerar chave de encriptação**:
```bash
node -e "const crypto = require('crypto'); console.log(crypto.randomBytes(32).toString('hex'))"
```

2. **Adicionar ao `.env`**:
```env
ENCRYPTION_KEY=seu_hash_de_64_caracteres
```

### Segurança da Chave

- ✅ Chave armazenada **APENAS** em `.env`
- ✅ Nunca commitada no git
- ✅ Rotação de chaves suportada
- ✅ IVs únicos para cada encriptação (mais seguro)

---

## 🛡️ Proteção de Dados Sensíveis {#proteção}

### User Model Enhancements

**Arquivo**: `backend/models/User.js`

```javascript
// Campos de segurança adicionados
{
  cpf: String,           // Encriptado
  cpfHash: String,       // Para verificação rápida
  lastLogin: Date,       // Rastreamento
  loginAttempts: Number, // Detecção de ataque
  isBlocked: Boolean,    // Rate limiting manual
  blockedUntil: Date,    // Tempo de espera
  dataConsent: Boolean,  // LGPD compliance
  consentDate: Date,     // Quando consentiu
  deletionRequested: Boolean, // Direito ao esquecimento
}
```

### Auto-sanitização

```javascript
// XSS Prevention: Remove tags perigosas
"<script>alert('xss')</script>" → "scriptalert('xss')/script"

// SQL Injection Prevention: Validação rigorosa
"'; DROP TABLE users; --" → Rejeitado com erro 400
```

---

## 📊 Sistema de Auditoria {#auditoria}

### Modelo AuditLog

**Arquivo**: `backend/models/AuditLog.js`

```javascript
{
  userId: ObjectId,              // Quem acessou
  resourceType: String,          // O quê (user, payment, etc)
  resourceId: ObjectId,          // Qual recurso
  action: String,                // (read, create, update, delete)
  fieldsAccessed: [String],      // Campos sensíveis acessados
  ipAddress: String,             // De onde
  userAgent: String,             // Qual navegador/app
  reason: String,                // Por que (medical_consultation, etc)
  status: String,                // success, failed, unauthorized
  createdAt: Date,               // Quando (com TTL 90 dias)
}
```

### Endpoints de Auditoria

```bash
# Ver seu histórico de acesso (GDPR Right)
GET /api/audit/my-access
Header: Authorization: Bearer <token>

# Ver auditoria de um recurso
GET /api/audit/resource/:resourceType/:resourceId

# Exportar auditoria (admin)
POST /api/audit/export
Body: { filters: {}, startDate, endDate }
Header: X-API-Key: <admin_key>
```

### Exemplos de Logs

```json
{
  "userId": "user_123",
  "resourceType": "user",
  "resourceId": "patient_456",
  "action": "read",
  "fieldsAccessed": ["cpf", "email", "phone"],
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "reason": "medical_consultation",
  "status": "success",
  "createdAt": "2026-05-12T10:30:00Z"
}
```

---

## 💰 Repasse Integro (100%) {#repasse}

### Fluxo de Pagamento

```
1. Paciente paga R$ 100 (Básico)
   ↓
2. Sistema cria Payment + Repasse
   ↓
3. Webhook confirma pagamento aprovado
   ↓
4. RepasseService cria registro:
   - grossAmount: 100
   - netAmount: 100  (SEM DEDUÇÕES)
   ↓
5. Repasse automático para profissional
   - Status: pending → processing → transferred
   - Nenhuma taxa ou juros debitados
```

### Modelo Repasse

**Arquivo**: `backend/models/Repasse.js`

```javascript
{
  paymentId: ObjectId,           // Referência ao pagamento
  professionalId: ObjectId,      // Quem recebe
  userId: ObjectId,              // Quem pagou
  planName: String,              // Qual plano
  grossAmount: 100,              // O que foi recebido
  netAmount: 100,                // 100% (sem taxas)
  taxAmount: 0,                  // Sempre 0
  status: String,                // pending → approved → processing → transferred
  approvedAt: Date,              // Quando foi aprovado
  processedAt: Date,             // Quando começou a processar
  transferredAt: Date,           // Quando foi enviado
  bankInfo: {                    // Dados bancários do profissional
    accountType: "pix",
    pixKey: "profissional@email.com",
    // ou dados de conta corrente
  }
}
```

### Verificação de Integridade

```bash
# Verificar se não houve deduções (security check)
GET /api/repassess/verify-integrity/:repasseId
Header: X-API-Key: <admin_key>

Response:
{
  "repasseId": "...",
  "noFeesDeducted": true,
  "status": "✅ Valid"
}
```

### Endpoints do Profissional

```bash
# Ver histórico de ganhos
GET /api/repassess/my-history
Header: Authorization: Bearer <token_profissional>

# Ver estatísticas de ganhos
GET /api/repassess/stats

# Exemplo de resposta:
{
  "totalEarned": "R$ 2,450.00",
  "pendingTransfer": "R$ 0.00",
  "failedTransfers": "R$ 0.00",
  "transactionCount": 5,
  "averagePerTransaction": "R$ 490.00",
  "note": "100% of earnings - no fees deducted"
}
```

---

## ⚖️ Conformidade LGPD/GDPR {#lgpd}

### Direitos dos Usuários

#### 1. **Direito à Informação** ✅
```bash
GET /api/audit/my-access
# Lista todas as vezes que seus dados foram acessados
```

#### 2. **Direito ao Acesso** ✅
```bash
GET /api/users/me
# Seus dados pessoais (CPF encriptado automaticamente)
```

#### 3. **Direito à Retificação** ✅
```bash
PUT /api/users/me
# Corrigir informações pessoais
```

#### 4. **Direito ao Esquecimento** 🔄
```bash
DELETE /api/users/me/request-deletion
# Solicitar exclusão (processada em 30 dias)
```

#### 5. **Direito à Portabilidade** ✅
```bash
POST /api/audit/export
# Exportar todos seus dados em JSON
```

### TTL de Dados

```javascript
// Logs de auditoria: auto-deletados após 90 dias
// Configurado em AuditLog.js

auditLogSchema.index({
  createdAt: 1
}, {
  expireAfterSeconds: 7776000 // 90 days
});
```

### Consentimento

```javascript
// User.dataConsent rastreia quando usuário consentiu
{
  dataConsent: true,
  consentDate: "2026-05-12T10:00:00Z",
  // Se dataConsent = false, dados são limitadamente processados
}
```

---

## 🛡️ Proteção contra Vulnerabilidades {#vulnerabilidades}

### 1. SQL Injection

**Proteção**: Mongoose + Input Validation
```javascript
// ❌ VULNERÁVEL (não usamos):
db.users.find({ email: userInput })

// ✅ PROTEGIDO (o que usamos):
User.findOne({ email: userInput })
// Mongoose automaticamente sanitiza
```

### 2. XSS (Cross-Site Scripting)

**Proteção**: Input Sanitization + Helmet
```javascript
// Middleware sanitizeInput remove:
- Script tags: <script> → remover
- Javascript protocol: javascript: → remover
- Event handlers: onclick= → remover

app.use(helmet()) // Content-Security-Policy headers
```

### 3. CSRF (Cross-Site Request Forgery)

**Proteção**: Verificação de Origin
```javascript
// Middleware preventCSRF:
Origin header != Host → Rejeitar com 403

// GET requests: sem verificação (idempotentes)
// POST/PUT/DELETE: origem verificada
```

### 4. Rate Limiting

**Proteção**: express-rate-limit

| Endpoint | Limite | Janela |
|----------|--------|--------|
| `/api/*` | 100 requisições | 15 min |
| `/api/auth/*` | 5 tentativas | 15 min |
| `/api/payments/*` | 3 tentativas | 1 min |

### 5. Brute Force

**Proteção**: loginAttempts + isBlocked

```javascript
// Após 5 tentativas falhadas:
user.isBlocked = true
user.blockedUntil = Date.now() + 30min

// Sistema detecta automaticamente e avisa
AuditService.detectSuspiciousActivity()
```

### 6. Sensitive Data Exposure

**Proteção**: 
- ✅ HTTPS obrigatório em produção
- ✅ CPF encriptado no banco
- ✅ Passwords com bcrypt (10 rounds)
- ✅ JWT com expiração 1h
- ✅ Tokens nunca em logs

---

## ⚙️ Configuração de Segurança {#configuração}

### Arquivo `.env` Necessário

```bash
# ========== GERAL ==========
NODE_ENV=production
PORT=3000

# ========== BANCO DE DADOS ==========
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/conecta_saude

# ========== AUTENTICAÇÃO ==========
JWT_SECRET=seu_jwt_secret_aleatorio_e_forte

# ========== ENCRIPTAÇÃO ==========
ENCRYPTION_KEY=gere_com: crypto.randomBytes(32).toString('hex')

# ========== MERCADO PAGO ==========
MERCADO_PAGO_ACCESS_TOKEN=seu_access_token
MERCADO_PAGO_PUBLIC_KEY=sua_public_key
BACKEND_BASE_URL=https://seu-dominio.com

# ========== SEGURANÇA INTERNA ==========
INTERNAL_API_KEY=seu_api_key_para_chamadas_internas

# ========== GOOGLE OAUTH ==========
GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret

# ========== AMBIENTE ==========
NODE_ENV=production
ENVIRONMENT=production
```

### Checklist de Deploy

- [ ] Todas as variáveis `.env` configuradas
- [ ] HTTPS ativado (forcing em produção)
- [ ] Cookies com flag `secure` e `httpOnly`
- [ ] CORS restrito a domínios conhecidos
- [ ] Rate limiting ativado
- [ ] Logs de auditoria ativados
- [ ] MongoDB com autenticação
- [ ] Backups diários ativados
- [ ] Monitoramento de segurança ativo
- [ ] Plano de resposta a incidentes

---

## 📱 Segurança no Frontend

### HealthcareApp

```javascript
// ✅ Token stored in AsyncStorage
// ✅ Sensitive data not logged
// ✅ HTTPS only (verificado pelo Expo)
// ✅ Biometric auth + PIN opcional

// API calls sempre incluem token:
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
```

---

## 🚨 Resposta a Incidentes

### Se houver vazamento detectado:

1. **Detectar**: Auditoria automática flagra acessos suspeitos
2. **Alertar**: Notificação imediata ao admin
3. **Isolar**: User bloqueado automaticamente
4. **Analisar**: Logs revisados para scope
5. **Comunicar**: Usuários afetados notificados
6. **Remediação**: Senha resetada, nova sessão

---

## 📞 Suporte & Conformidade

### Contatos
- **LGPD Officer**: seguranca@conectasaude.com
- **Security Team**: security@conectasaude.com
- **Incidente**: incidente@conectasaude.com

### Auditoria Anual
- [ ] Penetration Testing
- [ ] Code Review de Segurança
- [ ] Conformidade LGPD/GDPR
- [ ] Teste de Backup & Recovery

---

**Última atualização**: 12 de maio de 2026
**Versão**: 2.0 (Com Repasse 100%)

