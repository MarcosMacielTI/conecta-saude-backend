# 🔧 Diagnosticar Crash do Railway

## ✅ Melhorias Aplicadas

1. **Melhor tratamento de erros** no backend
2. **Health check endpoint** (`/api/health`)
3. **Logging melhorado** para diagnosticar problemas
4. **Graceful shutdown** para Railway

---

## 🚀 Próximas Ações

### 1️⃣ Commitear as mudanças
```bash
cd "c:\Users\user\Projetos\8. Projetos com Asafe\App_Conecta_Saude"
git add .
git commit -m "Improve Railway error handling and logging"
git push
```

### 2️⃣ Fazer Redeploy
1. Abra seu projeto no **Railway**
2. Clique na aplicação (nodejs)
3. Clique em **"Redeploy"**
4. Aguarde 2-3 minutos

### 3️⃣ Verificar Logs (CRÍTICO!)
1. Vá em **"Logs"** ou **"Deploy Logs"**
2. Procure por:
   - ❌ `MongoDB connection error` → MONGO_URI está errada
   - ❌ `Cannot find module` → Dependência faltando
   - ❌ `Port already in use` → Conflito de porta
   - ✅ `Server running on port` → OK!
   - ✅ `MongoDB connected successfully` → OK!

---

## 🆘 Se ainda Crashar

### **Opção 1: Ver Logs Detalhados**
1. Railway → Projeto → "Logs"
2. Copie os primeiros 50 erros
3. Cole aqui

### **Opção 2: Testar Localmente**
```bash
cd backend
npm install
npm start
```

Verifica se há erro no console local. Se funcionar localmente mas falha no Railway, é problema de variável de ambiente.

### **Opção 3: Verificar Variáveis**
No Railway:
1. Clique na aplicação
2. Vá em "Variables"
3. Confirme que **todas** estão lá:
   - [ ] MONGO_URI
   - [ ] JWT_SECRET
   - [ ] ENCRYPTION_KEY
   - [ ] NODE_ENV = production

---

## 📝 Checklist Diagnóstico

- [ ] Redeploy feito
- [ ] Logs consultados
- [ ] `MONGO_URI` configurada no Railway
- [ ] Health check funciona: `https://seu-projeto.up.railway.app/api/health`
- [ ] Nenhum erro de "Cannot find module"

---

**Por favor, compartilhe os logs do Railway para eu ajudar!** 🔍
