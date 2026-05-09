# Deploy de Demonstração Remota

## Objetivo

Preparar o sistema para demonstração remota com acesso ao frontend web e ao aplicativo móvel via Expo Go ou APK.

---

## 1. Backend

### 1.1 Configuração de ambiente

No diretório `backend`, copie o arquivo de exemplo:

```bash
cd backend
cp .env.example .env
```

Edite `.env` e defina:

```env
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/conecta_saude
JWT_SECRET=uma_senha_secreta
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
PORT=3000
```

### 1.2 Executar localmente

```bash
npm install
npm run start
```

### 1.3 Seed de dados de demonstração

```bash
npm run seed
```

Isso cria:
- 1 profissional
- 3 pacientes com login fácil
- vínculo automático entre paciente e profissional

#### Credenciais de teste dos pacientes
- `joao.teste@conectasaude.com / 123456`
- `maria.teste@conectasaude.com / 123456`
- `pedro.teste@conectasaude.com / 123456`

---

## 2. Frontend Web (Expo)

### 2.1 Configuração de ambiente

No diretório `HealthcareApp`, copie o exemplo:

```bash
cd HealthcareApp
cp .env.example .env
```

Edite `.env` e defina a URL pública do backend:

```env
API_URL=https://seu-backend-publico.com
```

### 2.2 Build web

```bash
npm install
npm run build:web
```

### 2.3 Deploy

Use a plataforma escolhida (Vercel, Netlify, Render, etc.) e aponte o build para o diretório `HealthcareApp/web-build`.

---

## 3. App Mobile (Expo)

### 3.1 Configuração de ambiente

Certifique-se de que `HealthcareApp/.env` contém a URL da API pública:

```env
API_URL=https://seu-backend-publico.com
```

### 3.2 Publicar no Expo Go

No diretório `HealthcareApp`:

```bash
npm install
expo publish
```

Em seguida, compartilhe o link ou QR Code gerado pelo Expo.

### 3.3 Gerar APK (opcional)

```bash
expo build:android
```

ou se estiver usando EAS:

```bash
eas build --platform android
```

---

## 4. Docker / Deploy em serviços online

### 4.1 Backend com Docker

O diretório `backend` agora contém um `Dockerfile` e `.dockerignore`.

```bash
cd backend
docker build -t conecta-saude-backend .
docker run -p 3000:3000 --env-file .env conecta-saude-backend
```

### 4.2 Deploy em serviços compatíveis

Use o `Dockerfile` para plataformas como Render, Railway, или Heroku Container Registry.

---

## 5. Ajustes já aplicados

- O app móvel e a web agora consomem o backend por `API_URL` definido em ambiente
- A dependência de `localhost` foi removida do `HealthcareApp/api.js`
- O backend aceita CORS globalmente
- O backend usa `index.js` como entrypoint de produção

---

## 6. Próximo passo para demonstração

1. Faça deploy do backend em um serviço online
2. Ajuste `API_URL` no `HealthcareApp/.env`
3. Gere o build web em `HealthcareApp/web-build`
4. Publique o app no Expo e compartilhe o link ou QR Code
