# Guia de Limpeza de Usuários de Teste e Debug de Upload de Foto

## 🗑️ Deletar Usuários de Teste

### Opção 1: Via API Endpoint (Recomendado)

Faça uma requisição DELETE para limpar usuários de teste:

```bash
curl -X DELETE http://localhost:3000/api/auth/admin/cleanup-test-users \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json"
```

**Resposta esperada:**
```json
{
  "message": "Test users cleaned up successfully",
  "deletedCount": 8
}
```

**Quando usar:** Em qualquer ambiente (dev, staging, prod) se NODE_ENV=development ou ALLOW_CLEANUP=true no .env.

### Opção 2: Via MongoDB Shell (Manual)

Se preferir limpar manualmente:

```javascript
// Conecte com: mongosh "mongodb://localhost:27017/conecta_saude"
// Ou via Atlas: mongosh "mongodb+srv://user:pass@cluster.mongodb.net/conecta_saude"

// Delete emails específicos
db.users.deleteMany({ 
  email: { 
    $in: [
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
    ] 
  } 
});

// Delete por padrão de nome
db.users.deleteMany({ 
  name: { 
    $regex: /^(Test User|João Silva|Maria Santos|Pedro Almeida)$/i 
  } 
});

// Verificar quantos restaram
db.users.countDocuments();
```

### Opção 3: Via Node Script

```bash
cd backend
node cleanup-test-users.js
```

**Nota:** MongoDB deve estar rodando localmente ou via Atlas.

---

## 📸 Testar Upload de Foto

### 1. No Frontend (App React Native)

1. Abra o app
2. Faça login com uma conta de teste ou real
3. Clique no avatar (foto de perfil) no topo da tela
4. Selecione uma foto da galeria ou tire uma foto
5. Clique em "Confirmar" e aguarde a mensagem de sucesso

**Logs esperados:**
```
📸 Base64 size: 150000 bytes
📸 Sending image to backend...
📸 Backend response: 200 {data}
📸 Updating user context...
✓ Sucesso: Foto de perfil atualizada com sucesso!
```

### 2. Via cURL (Backend)

```bash
# 1. Fazer login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com","password":"sua_senha"}' \
  | jq -r '.token')

# 2. Preparar imagem em base64
BASE64_IMAGE=$(cat seu_arquivo.jpg | base64)

# 3. Enviar para backend
curl -X PUT http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"image\":\"data:image/jpeg;base64,$BASE64_IMAGE\"}"
```

**Resposta esperada:**
```json
{
  "_id": "...",
  "id": "...",
  "name": "Seu Nome",
  "email": "seu@email.com",
  "role": "patient",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
  "plan": "sem plano",
  "consultationsLeft": 0
}
```

---

## 🐛 Debug de Upload

### Se a foto não aparecer após upload bem-sucedido:

#### 1. Verificar Console do Backend
```bash
# Terminal do backend
npm start

# Procure por:
# ✓ PUT /auth/me com status 200
# ✓ Image tamanho e primeiros caracteres
# ✓ User salvo com image field
```

#### 2. Verificar Banco de Dados
```javascript
// mongosh
db.users.findOne({ email: "seu@email.com" })
// Deve ter field 'image' com string base64
```

#### 3. Verificar Console do App (React Native)
- Abra o terminal onde Metro está rodando
- Procure por `📸` logs
- Se ver erro, verifique a resposta do backend

#### 4. Forçar Refresh
- Faça logout e login novamente
- Ou feche e reabra o app
- Isso recarrega o `AuthContext`

### Tamanho máximo suportado:
- **Limite backend:** 5MB
- **Recomendação:** Usar fotos até 2MB (qualidade 0.8 via ImagePicker)

---

## ✅ Checklist Pós-Implementação

- [ ] Sem usuários fictícios em User.countDocuments()
- [ ] Upload de foto aparece no perfil após sucesso
- [ ] Avatar mostra ícone de pessoa quando sem imagem
- [ ] Foto persiste após logout e login
- [ ] Professional screens (Agenda, Relatórios, Prontuários) mostram dados reais
- [ ] Sem erros no console (React Native ou Node)
- [ ] Sem referências a pravatar.cc

---

## 📋 Variáveis de Ambiente

Adicione ao `.env` para controlar cleanup:

```env
# Permite cleanup de usuários de teste em qualquer NODE_ENV
ALLOW_CLEANUP=true

# Ou defina NODE_ENV como development
NODE_ENV=development
```

---

## 🔗 Endpoints Relacionados

- `GET /auth/me` - Obter perfil do usuário atual
- `PUT /auth/me` - Atualizar nome/foto do usuário
- `DELETE /auth/admin/cleanup-test-users` - Limpar usuários de teste (admin only)
- `GET /professionals` - Listar profissionais
- `GET /appointments` - Listar compromissos

---

Última atualização: Janeiro 2025
