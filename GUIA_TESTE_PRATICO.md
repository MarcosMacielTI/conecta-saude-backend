# 🧪 GUIA PRÁTICO DE TESTE - Conecta Saúde

## ⚡ Quick Start (5 minutos)

### **Pré-requisito: Backend e BD rodando**

```bash
# Terminal 1: Backend
cd backend
npm start
# Deve aparecer: "Server running on port 3000"
```

### **Pré-requisito: Frontend rodando**

```bash
# Terminal 2: Frontend
cd HealthcareApp
npm start
# Escolha: Expo Go ou Emulador
```

---

## 🧑‍💼 TESTE 1: Paciente Faz Teste Premium

### **Passos**

1. **Login como Paciente**
   ```
   Email: patient@example.com
   Senha: password123
   ```
   ✅ Esperado: Home screen com plano "Sem Plano"

2. **Acesse Plans Tab**
   ```
   Botão inferior: Plans
   ```
   ✅ Esperado: Vê "Teste Premium" em primeiro lugar

3. **Toque em "Teste Premium"**
   ```
   Card azul escuro no topo
   ```
   ✅ Esperado: Diálogo com "Plano Premium por R$0,01?"

4. **Confirme "Sim"**
   ```
   Botão: Sim
   ```
   ✅ Esperado: Alert "Voc ê fez o plano Premium de teste!"

5. **Volte para Home**
   ```
   Tab: Home
   ```
   ✅ Esperado: Vê "Teste Premium Ativo" com "3 Consultas"

---

## 🔍 TESTE 2: Paciente Busca e Conecta a Profissional

### **Passos**

1. **Acesse Search Tab**
   ```
   Botão inferior: Search
   ```
   ✅ Esperado: Lista de profissionais carregando

2. **Aguarde Carregamento**
   ```
   Aguarde 2-3 segundos
   ```
   ✅ Esperado: Profissionais aparecem com nome, especialidade, qualificações

3. **Veja Detalhes do Profissional**
   ```
   Olhe para um card:
   - Nome
   - Especialidade
   - Qualificações (se houver)
   - Email
   - Disponibilidade
   - Preço
   ```

4. **Clique "Conectar"**
   ```
   Botão azul à direita do card
   ```
   ✅ Esperado: Botão fica "Conectando..." durante 1-2s

5. **Veja Confirmação**
   ```
   Alert: "Conectado ao profissional com sucesso!"
   ```
   ✅ Esperado: Navegação volta para Home

6. **Verifique Atualização**
   ```
   Volte para Search
   - Botão "Conectar" agora está desativado
   - User tem user.professionalId agora
   ```

---

## 💬 TESTE 3: Chat em Tempo Real

### **Lado Paciente**

1. **Acesse Chat Tab**
   ```
   Botão inferior: Chat
   ```
   ✅ Esperado: Vê conversa com profissional conectado

2. **Toque na Conversa**
   ```
   Card do profissional
   ```
   ✅ Esperado: Abre tela de chat

3. **Veja Histórico**
   ```
   Se houver mensagens antigas, aparecem aqui
   ```

4. **Digite Mensagem**
   ```
   Input: "Olá! Tudo bem?"
   ```

5. **Envie**
   ```
   Botão azul de enviar (➤)
   ```
   ✅ Esperado: Mensagem aparece na tela (azul, lado direito)

6. **Aguarde Resposta**
   ```
   Deixe a tela aberta
   Aguarde 3-5 segundos
   ```
   ✅ Esperado: Se profissional responder, aparece (cinza, lado esquerdo)

### **Lado Profissional**

1. **Login como Profissional**
   ```
   Email: professional@example.com
   Senha: password123
   ```

2. **Acesse Chat Tab**
   ```
   Botão inferior: Chat
   ```
   ✅ Esperado: Vê conversa com paciente conectado

3. **Toque no Paciente**
   ```
   Card do paciente
   ```
   ✅ Esperado: Vê mensagem do paciente ("Olá! Tudo bem?")

4. **Responda**
   ```
   Input: "Oi! Tudo bem sim!"
   ```

5. **Envie**
   ```
   Botão azul de enviar
   ```
   ✅ Esperado: Sua mensagem aparece (azul, lado direito)

6. **Volta ao Paciente**
   ```
   Troque para aba do Paciente
   Aguarde 3 segundos (polling)
   ```
   ✅ Esperado: Resposta do profissional aparece

---

## 📞 TESTE 4: Video Chamada (UI Demo)

### **Passos**

1. **No Chat, Clique Ícone de Telefone**
   ```
   Canto superior direito
   Ícone: ☎️
   ```
   ✅ Esperado: Navega para VideoScreen

2. **Veja Interface**
   ```
   - Nome do profissional/paciente
   - Botão "Iniciar Chamada"
   - Estilo dark mode
   ```

3. **Clique "Iniciar Chamada"**
   ```
   Botão azul grande
   ```
   ✅ Esperado: 
   - Botão fica "Em chamada"
   - Aparecem controles de Mic/Câmera
   - Miniatura do "você" no canto

4. **Teste Controles**
   ```
   Clique em: Mic ON/OFF
   Clique em: Câmera ON/OFF
   ```
   ✅ Esperado: Ícones mudam (cinza quando desativado)

5. **Encerre Chamada**
   ```
   Botão vermelho (X)
   ```
   ✅ Esperado: Volta para tela anterior

---

## 🔍 TESTE 5: Profissional Busca Pacientes

### **Lado Profissional**

1. **Acesse ProfessionalSearch Tab**
   ```
   Se em Professional mode
   Botão: Search ou Professional Search
   ```
   ✅ Esperado: Lista de pacientes carregando

2. **Veja Informações do Paciente**
   ```
   - Nome
   - Email
   - CPF
   - Plano (com badge colorida)
   - Status (Ativo/Inativo)
   - Consultas restantes
   ```

3. **Filtre por Plano**
   ```
   Scroll horizontal nos filtros
   Clique: "Premium"
   ```
   ✅ Esperado: Mostra apenas pacientes Premium

4. **Busque por Nome**
   ```
   Input de busca
   Digite: "João"
   ```
   ✅ Esperado: Filtra pacientes com "João" no nome

5. **Clique em Paciente**
   ```
   Card do paciente
   ```
   ✅ Esperado: Abre ChatScreen com este paciente

---

## 📊 TESTE 6: Validações

### **Validação 1: Sem Plano**
```
1. Login como novo paciente
2. Tente acessar Chat
✅ Esperado: Alert "Plano Necessário"

3. Tente acessar Search
✅ Esperado: Pode ver profissionais mas "Conectar" desativado
```

### **Validação 2: Já Conectado**
```
1. Paciente já conectado a profissional
2. Tente conectar a outro
✅ Esperado: Botão "Conectar" desativado/cinza
```

### **Validação 3: Múltiplos Usuários**
```
1. Abra paciente em um celular
2. Abra profissional em outro celular
3. Envie mensagem do paciente
✅ Esperado: Profissional vê em 3-5 segundos (polling)
```

---

## 🐛 Troubleshooting

### **Problema: Chat vazio**
```
❌ Solução:
1. Verifique se paciente tem profissionalId
2. Verifique se conexão existe no BD
3. Verifique se há mensagens no BD
4. Refresh a página
```

### **Problema: Mensagem não envia**
```
❌ Solução:
1. Verifique se tem plano ativo
2. Verifique conexão com internet
3. Verifique logs do backend
4. Verifique JWT no header
```

### **Problema: Profissional não vê paciente**
```
❌ Solução:
1. Verifique role do usuário (deve ser 'professional')
2. Verifique se paciente fez conexão
3. Verifique ID da conexão
```

### **Problema: Busca não retorna resultados**
```
❌ Solução:
1. Verifique se há profissionais/pacientes no BD
2. Teste sem filtro primeiro
3. Verifique se backend está rodando
```

---

## 🧮 Checksum de Sucesso

### **Paciente**
- [x] Fez teste Premium por R$0,01
- [x] Vê 3 consultas no home
- [x] Encontrou profissional
- [x] Conectou com sucesso
- [x] Abriu chat
- [x] Enviou mensagem
- [x] Recebeu resposta
- [x] Clicou vídeo
- [x] Viu UI de chamada
- [x] Validações funcionaram

### **Profissional**
- [x] Vê paciente no chat
- [x] Recebeu mensagem
- [x] Respondeu mensagem
- [x] Filtrou pacientes por plano
- [x] Buscou por nome/email/cpf
- [x] Clicou paciente e abriu chat
- [x] Viu informações do paciente

### **Backend**
- [x] POST /connect funcionou
- [x] GET /connections funcionou
- [x] POST /messages funcionou
- [x] GET /messages/:id funcionou
- [x] Validações de role funcionaram
- [x] JWT funcionou

---

## 🎯 Resultado Esperado: SUCESSO ✅

Se todos os testes passarem, o sistema está:
- ✅ Operacional
- ✅ Seguro
- ✅ Escalável
- ✅ Pronto para produção

---

## 📝 Notas

- **Polling**: 3 segundos entre atualizações (normal)
- **Latência**: Pode ser 0-3s dependendo do servidor
- **Demo**: Video é apenas UI, WebRTC virá depois
- **Banco**: Use MongoDB local ou Atlas

---

## 💬 Feedback

Após os testes, considere:
1. **Performance** - Rápido ou lento?
2. **UX** - Fácil de usar?
3. **Bugs** - Encontrou algum?
4. **Melhorias** - O que melhorar?

---

**Bom teste! 🎉**

Data: 08 de Maio de 2026  
Conecta Saúde v1.0
