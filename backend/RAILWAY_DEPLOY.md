# Deploy no Railway - Guia Passo a Passo

## O que você precisa
- Conta Railway (gratuita em https://railway.app)
- Seu `.env` com as variáveis corretas
- Git instalado (opcional, mas recomendado)

## Passo 1: Criar Conta e Projeto Railway

1. Acesse https://railway.app
2. Clique em "Get Started" e faça login/registre-se
3. Clique em "New Project"
4. Escolha uma dessas opções:
   - **GitHub**: Conectar repositório (mais fácil para atualizações automáticas)
   - **Deploy from GitHub Repo**
   - **CLI**: Usar Railway CLI (linha de comando)

## Passo 2: Variáveis de Ambiente (IMPORTANTES!)

Após criar o projeto no Railway, você precisa definir estas variáveis no painel:

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

### Como adicionar variáveis no Railway:
1. Abra seu projeto no Railway
2. Clique em "Variables"
3. Clique em "Add Variable"
4. Copie cada chave e valor do `.env` acima
5. Clique "Save"

## Passo 3: Deploy via CLI (RECOMENDADO)

### Opção A: Deploy direto com Railway CLI

```bash
# 1. Instale Railway CLI
npm install -g @railway/cli

# 2. Faça login
railway login

# 3. Crie um novo projeto
railway init

# 4. Deploy automático
railway up
```

### Opção B: Deploy via GitHub

1. Faça push do código para GitHub:
```bash
cd backend
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/seu-usuario/seu-repo.git
git push -u origin main
```

2. No Railway:
   - Clique "New Project" → "Deploy from GitHub Repo"
   - Selecione o repositório
   - Railway detecta automaticamente o `package.json`
   - Clique "Deploy"

## Passo 4: Obter a URL Pública

1. Após o deploy, abra seu projeto no Railway
2. Clique na aplicação
3. Em "Domains", clique "Generate Domain"
4. Copie a URL que aparecer (ex: `seu-projeto.up.railway.app`)
5. Salve essa URL para usar no app

## Passo 5: Configurar o App Expo

Após obter a URL pública, atualize o arquivo:

**HealthcareApp/app.config.js**
```javascript
require('dotenv').config();
const appJson = require('./app.json');

const apiUrl = process.env.API_URL || appJson.expo?.extra?.API_URL || 'https://seu-projeto.up.railway.app';

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      API_URL: apiUrl,
    },
  },
};
```

Ou defina uma variável de ambiente:
```bash
set API_URL=https://seu-projeto.up.railway.app
npm start  # ou expo start
```

## Passo 6: Testar Conexão

1. Inicie o app Expo
2. Faça login
3. Vá para Chat → verifique se as mensagens funcionam
4. Verifique no painel Railway se não há erros

## Verificar Logs no Railway

Se algo não funcionar:
1. Abra o projeto no Railway
2. Clique na aplicação
3. Vá em "Logs"
4. Procure por erros (ex: "MongoError", "Connection refused")
5. Se houver erro, corrija a variável de ambiente e salve

## Troubleshooting

### Erro: "Connection refused" ou "MONGO_URI not found"
- Verifique se todas as variáveis estão definidas em Railway → Variables
- Clique "Redeploy" após adicionar/alterar variáveis

### Erro: CORS ou "Cannot connect to backend"
- Certifique-se que o `API_URL` no app.config.js usa a URL exata do Railway
- Verifique se a URL do Railway está acessível (teste no navegador)

### Erro: "Port already in use"
- Railway atribui porta automaticamente via `process.env.PORT`
- Se ainda não funciona, remova `PORT=3000` das variáveis

## Próximos Passos

1. ✅ Deploy backend no Railway
2. ✅ Obter URL pública
3. ✅ Configurar `API_URL` no app
4. ✅ Testar conexão
5. Fazer push do app em produção (Expo)
6. Monitorar performance e logs
