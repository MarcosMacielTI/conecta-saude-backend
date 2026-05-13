# 🚀 PASSO A PASSO - Deploy & Conexão Remota

## RESUMO RÁPIDO (10 minutos)

### 1️⃣ Criar Conta no Railway (GRÁTIS)
- Acesse: https://railway.app
- Clique "Get Started"
- Login com GitHub ou email
- ✅ Pronto!

### 2️⃣ Criar Projeto
- Clique "New Project"
- Escolha "Deploy from GitHub Repo" (mais fácil)
  - OU "CLI" se não tem GitHub
  - OU "Deploy from template"

### 3️⃣ Adicionar Variáveis de Ambiente
No painel Railway, vá para "Variables" e adicione:

```
MONGO_URI=mongodb+srv://MarcosMacielTI-mongodb:Maciel12%24@cluster0.e86k6x1.mongodb.net/conecta_saude?retryWrites=true&w=majority

JWT_SECRET=seu_jwt_secret_super_secreto_2024

GOOGLE_CLIENT_ID=296970277969-gnpekkvoiok4n20rfgc06sv2bvjbrsdc.apps.googleusercontent.com

GOOGLE_CLIENT_SECRET=SEU_SECRET

ENCRYPTION_KEY=559eff46f71f21303da24256eae2422d08c9e6a11007bc7175b31434a48a993f

INTERNAL_API_KEY=seu_api_key_interno_aleatorio

MERCADO_PAGO_ACCESS_TOKEN=seu_access_token_mercado_pago_aqui

MERCADO_PAGO_PUBLIC_KEY=seu_public_key_mercado_pago_aqui

MERCADO_PAGO_WEBHOOK_SECRET=seu_webhook_secret_aqui

BACKEND_BASE_URL=https://seu-projeto-railway.up.railway.app

NODE_ENV=production
```

### 4️⃣ Deploy
- Se GitHub: Railway faz automaticamente ✅
- Se CLI: 
  ```bash
  npm install -g @railway/cli
  railway login
  railway init
  railway up
  ```

### 5️⃣ Obter URL Pública
1. Abra seu projeto no Railway
2. Clique na aplicação (ex: "nodejs")
3. Vá em "Networking" ou "Domains"
4. Clique "Generate Domain" 
5. Copie: `seu-projeto.up.railway.app` ✅

### 6️⃣ Atualizar App Expo
Abra `HealthcareApp/app.config.js` e altere para:
```javascript
const apiUrl = process.env.API_URL || 'https://seu-projeto.up.railway.app';
```

Ou rode no terminal:
```bash
set API_URL=https://seu-projeto.up.railway.app
npm start
```

### 7️⃣ Testar
1. Inicie app Expo
2. Faça login
3. Vá para Chat
4. Verifique se mensagens funcionam ✅

## ⚠️ PONTOS CRÍTICOS

- **Substitua `seu-projeto.up.railway.app`** pela URL real que o Railway gerar
- **Não deixe credenciais no código** - use variáveis de ambiente
- **Mongo já está em Atlas** - você não precisa criar nada, está no `MONGO_URI`
- **Railway é grátis** - 5$ de crédito por mês, mais que suficiente

## 🔧 SE ALGO DER ERRADO

### Backend não inicia?
1. Vá em "Logs" no Railway
2. Procure por erros (ex: "MongoError", "ECONNREFUSED")
3. Se for erro de variável: adicione/corrija em "Variables"
4. Clique "Redeploy"

### App não consegue conectar?
1. Teste a URL no navegador: `https://seu-projeto.up.railway.app/api`
2. Deve retornar um erro 404 ou JSON (não "Cannot reach server")
3. Se não funcionar, cheque variáveis no Railway

### Chat não funciona?
1. Abra F12 (DevTools)
2. Verifique se Socket.IO conectou (debe avisar "Connected to Socket.IO")
3. Se não conectou, a URL do `API_URL` está errada

## 📝 CHECKLIST FINAL

- [ ] Conta Railway criada
- [ ] Projeto criado no Railway
- [ ] Todas as variáveis de ambiente adicionadas
- [ ] Backend deployado (verde em Railway ✅)
- [ ] URL pública obtida (ex: `seu-projeto.up.railway.app`)
- [ ] `API_URL` atualizada no `app.config.js`
- [ ] App testado e funcionando

---

**Precisa de ajuda? Diga qual passo está preso!** 👍
