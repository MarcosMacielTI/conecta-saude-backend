# Guia de Testes - Conexão Paciente-Profissional

## 🔧 Configuração Inicial

### Backend
```bash
cd backend
npm start
# Aguarde a mensagem: "Server running on http://localhost:3000"
```

### Frontend (Expo)
```bash
cd HealthcareApp
npm start
# Escolha 'a' para Android ou 'i' para iOS
```

---

## ✅ Teste 1: Registro e Conexão Automática

### Passo 1: Registre o Profissional
1. Na tela de login, clique em "Não tem uma conta? Registre-se"
2. Preencha:
   - **Nome**: Dr. João Silva
   - **Email**: profissional@test.com
   - **Senha**: Test123456
   - **CPF**: 12345678900
   - **Função**: Profissional de Saúde
3. Clique em "Criar Conta"
4. Você deve ser levado à tela inicial do profissional

### Passo 2: Verifique o Profissional na Aba Inicial
- Na tela do profissional, vá para "Início" (ProfHome)
- **Esperado**: O resumo mostra "1 Paciente" (quando paciente se registrar)

### Passo 3: Registre o Paciente (Em outro dispositivo ou nova sessão)
1. Faça logout do profissional
2. Clique em "Não tem uma conta? Registre-se"
3. Preencha:
   - **Nome**: Maria Silva
   - **Email**: paciente@test.com
   - **Senha**: Test123456
   - **CPF**: 98765432100
   - **Função**: Paciente
4. Clique em "Criar Conta"
5. Você deve ser levado à tela inicial do paciente

---

## ✅ Teste 2: Paciente Vê Profissional Conectado

### Na tela do Paciente
1. **Tela Inicial**: Procure pela seção "Seu profissional conectado"
   - **Esperado**: Deve exibir:
     - Nome do profissional: "Dr. João Silva"
     - Especialidade: "Especialista"
     - Número de pacientes: "1"

2. **Tela de Perfil**: Clique em "Perfil" na barra inferior
   - **Esperado**: Deve exibir card com o profissional conectado

---

## ✅ Teste 3: Profissional Vê Todos os Pacientes

### Na tela do Profissional
1. **Tela Inicial (ProfHome)**: Na seção "Próximas Consultas"
   - **Esperado**: Deve listar o paciente "Maria Silva"

2. **Buscar Pacientes**: Se houver endpoint de busca específica
   - Use a API `GET /api/professionals/:id/patients`

---

## 🔐 Teste 4: Autenticação por Biometria

### Ao fazer login novamente:
1. Na tela de login, após fazer login inicial (senha)
2. **Na próxima vez que abrir o app**, clique em "Entrar com Impressão Digital"
3. **Esperado**: Abre dialog de autenticação biométrica
   - No simulador: pode usar a senha PIN ou face
   - Em dispositivo real: usa impressão digital

---

## 🧪 Teste 5: Validar Dados Retornados

### Abra o DevTools ou verifique logs:
```javascript
// Esperado no login/registro:
{
  "token": "eyJhbGci...",
  "user": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0",
    "id": "64f1a2b3c4d5e6f7g8h9i0",
    "name": "Maria Silva",
    "email": "paciente@test.com",
    "role": "patient",
    "cpf": "98765432100",
    "professionalId": "64e9z8y7x6w5v4u3t2s1r0",  // ✨ NOVO
    "plan": null,
    "consultationsLeft": 0
  }
}
```

---

## 📋 Checklist de Validação

### Backend
- [ ] POST /auth/register cria Professional quando role='professional'
- [ ] POST /auth/register adiciona paciente à clients do profissional
- [ ] GET /professionals retorna o profissional único com clients populados
- [ ] GET /professionals/:id retorna profissional com clients
- [ ] GET /professionals/:id/patients retorna lista de pacientes

### Frontend - Paciente
- [ ] HomeScreen mostra "Seu profissional conectado"
- [ ] ProfileScreen mostra profissional conectado
- [ ] Dados exibidos estão corretos (nome, especialidade)

### Frontend - Profissional
- [ ] ProfessionalScreen (Início) mostra lista de pacientes
- [ ] Número de pacientes está correto

### Biometria
- [ ] Botão "Entrar com Impressão Digital" aparece após primeiro login
- [ ] Biometria funciona no simulador/dispositivo

---

## 🐛 Troubleshooting

### Paciente não vê profissional
1. Verifique se `professionalId` está sendo retornado na resposta do login
2. Verifique no MongoDB se `User.professionalId` está preenchido
3. Verifique se `Professional.clients` contém o ID do paciente

### Profissional não vê pacientes
1. Verifique se `GET /professionals/:id/patients` retorna array de clientes
2. Verifique se a populate está funcionando corretamente

### Biometria não aparece
1. Certifique-se de ter feito login com sucesso uma vez
2. Verifique se AsyncStorage salvou `lastEmail` e `lastPassword`
3. Verifique se o dispositivo suporta biometria (simulador: sim, se configurado)

---

## 🚀 Próximos Passos
1. Testar com múltiplos pacientes (3+)
2. Testar planos e consultas restantes
3. Testar logout/login em sequência
4. Testar Google OAuth (se implementado)

