# Sistema de Chamadas de Vídeo e Agendamento de Horários

## Resumo das Mudanças

Este documento descreve as implementações realizadas para adicionar funcionalidades de chamadas de vídeo e agendamento de horários profissionais no sistema Conecta Saúde.

## 1. Arquitetura Backend

### Modelo de Disponibilidade (`backend/models/Availability.js`)

Novo modelo MongoDB para armazenar a disponibilidade semanal dos profissionais:

```javascript
{
  professionalId: ObjectId (unique),
  schedule: {
    Monday: { active: true, startTime: "08:00", endTime: "17:00" },
    Tuesday: { active: true, startTime: "08:00", endTime: "17:00" },
    // ... outros dias
    Sunday: { active: false, startTime: "00:00", endTime: "00:00" }
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Padrão Padrão:**
- Segunda a Sexta: 08:00 - 17:00 (ativo)
- Sábado: 09:00 - 12:00 (ativo)
- Domingo: Fechado (inativo)

### Rotas de API (`backend/routes/availability.js`)

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/api/availability/:professionalId` | Obter horários de qualquer profissional (cria padrão se não existir) | Não requerida |
| GET | `/api/availability` | Obter próprios horários (profissional autenticado) | JWT requerida |
| PUT | `/api/availability` | Atualizar próprios horários | JWT requerida |

**Exemplo de Requisição PUT:**
```json
{
  "schedule": {
    "Monday": { "active": true, "startTime": "09:00", "endTime": "18:00" },
    "Tuesday": { "active": true, "startTime": "09:00", "endTime": "18:00" },
    // ... outros dias
  }
}
```

## 2. Integração Backend

### Modificações em `backend/index.js`

1. **Registro de Rotas:** Linha ~62
   ```javascript
   app.use('/api', require('./routes/availability'));
   ```

2. **Melhorias de Socket.IO:** Linhas ~230-240
   - Emissão para múltiplos canais para garantir entrega em tempo real
   - Logs detalhados de receção de mensagens
   - Normalização de IDs para strings

## 3. API Frontend (`HealthcareApp/api.js`)

Novos métodos para gerenciamento de disponibilidade:

```javascript
export const availabilityAPI = {
  getMyAvailability: () => api.get('/availability'),
  updateMyAvailability: (schedule) => api.put('/availability', { schedule }),
  getProfessionalAvailability: (professionalId) => api.get(`/availability/${professionalId}`),
};
```

## 4. Componentes React Native

### A. Modal de Visualização de Horários (`HealthcareApp/src/components/AvailabilityModal.js`)

**Propósito:** Mostrar os horários disponíveis de um profissional em uma visualização modal.

**Props:**
- `visible` (boolean) - Controla visibilidade
- `onClose` (function) - Callback ao fechar
- `professionalId` (string) - ID do profissional a visualizar
- `colors` (object) - Cores do tema

**Recursos:**
- Lista dos 7 dias da semana em português
- Indicador visual de dias ativos (checkmark verde)
- Horários início/fim para dias ativos
- Loading spinner durante busca
- Tratamento de erros

**Exemplo de Uso:**
```jsx
<AvailabilityModal
  visible={showAvailability}
  onClose={() => setShowAvailability(false)}
  professionalId={selectedProfessionalId}
  colors={colors}
/>
```

### B. Tela de Gerenciamento de Horários (`HealthcareApp/AvailabilityManagementScreen.js`)

**Propósito:** Permitir que profissionais configurem seus horários disponíveis.

**Funcionalidades:**
- Toggle de dias (ativo/inativo)
- Edição de horários de início e fim
- Validação de dados
- Salvamento via API
- Feedback visual de sucesso/erro
- Loading states

**Navegação:** Acessível via `navigation.navigate('AvailabilityManagement')`

**Estrutura da Tela:**
```
Header
├── Voltar
├── Título "Meus Horários"
Content
├── Info Box (instruções)
├── Lista de 7 dias
│  ├── Checkbox (ativo/inativo)
│  ├── Nome do dia
│  └── Inputs de horário (quando ativo)
Footer
├── Botão "Salvar Horários"
```

### C. Tela de Vídeo Chamada (`HealthcareApp/VideoScreen_new.js`)

**Propósito:** Interface para chamadas de vídeo com integração Jitsi Meet.

**Características:**
- Sala de espera pré-chamada
- Exibição do nome do profissional/paciente
- Informações de disponibilidade
- WebView com Jitsi Meet
- Botão para encerrar chamada (styled com animação)

**Room ID:**
- Derivado de: `appointment.videoLink` ou `contact.connectionId` ou timestamp
- Formato URL: `https://meet.jit.si/{roomId}`

**Props Esperadas via Navegação:**
```javascript
navigation.navigate('Video', {
  contact: {
    name: 'Dr. João',
    id: 'professional_id',
    connectionId: 'unique_connection_id'
  }
})
// ou
navigation.navigate('Video', {
  appointment: {
    videoLink: 'appointment_room_id'
  }
})
```

### D. Lista de Conversas Aprimorada (`HealthcareApp/ChatScreen.js`)

**Mudanças:**
1. **Avatar Reduzido:** De 48x48 para 40x40 (estilo WhatsApp)
2. **Ações Rápidas:** Adicionadas duas actions abaixo de cada conversa
   - 🎥 **Chamar** - Inicia chamada de vídeo
   - 📅 **Horários** - Visualiza agenda do profissional
3. **Modal de Disponibilidade:** Integrada bottom sheet com horários

**Layout de Conversa:**
```
┌─────────────────────────────────┐
│ [Avatar] Nome  [Hora] [Badge]   │
│          Especialidade           │
│          Última mensagem...      │
├─────────────────────────────────┤
│  [🎥 Chamar] [📅 Horários]      │
└─────────────────────────────────┘
```

**Lógica de Navegação:**
- Botão "Chamar" → `navigation.navigate('Video', { contact: item })`
- Botão "Horários" → Abre modal com `availabilityAPI.getProfessionalAvailability()`

## 5. Atualização da Navegação (`HealthcareApp/App.js`)

### Imports Adicionados:
```javascript
import VideoScreen_new from './VideoScreen_new';
import AvailabilityManagementScreen from './AvailabilityManagementScreen';
```

### Stacks Atualizadas:

**PatientStackNavigator:**
- Video screen agora usa `VideoScreen_new`

**ProfessionalStackNavigator:**
- Adicionada nova rota: `AvailabilityManagement`
- Video screen agora usa `VideoScreen_new`

**RootStackNavigator:**
- Ambos Video screens atualizado para `VideoScreen_new`

## 6. Fluxo de Usuário

### Para Pacientes (Patient):
1. Abre lista de conversas (ChatScreen)
2. Vê conversa com profissional
3. Clica em "🎥 Chamar" → Inicia chamada de vídeo
4. Clica em "📅 Horários" → Vê agenda disponível do profissional
5. Profissional vê sala de espera com nome do paciente
6. Profissional clica "Iniciar Chamada"
7. Ambos entram na sala Jitsi Meet

### Para Profissionais (Professional):
1. Navega para ProfessionalAgenda ou similar
2. Acessa "Meus Horários"
3. Na tela AvailabilityManagement:
   - Toggle dias (ativo/inativo)
   - Define horários de início e fim
   - Clica "Salvar Horários"
4. Horários salvos no MongoDB
5. Pacientes veem horários disponíveis quando clicam "Horários"

## 7. Pontos de Integração

### Próximos Passos:

1. **Adicionar Botão de Acesso** (em ProfessionalAgendaScreen ou similar)
   ```jsx
   <Pressable onPress={() => navigation.navigate('AvailabilityManagement')}>
     <Text>Gerenciar Horários</Text>
   </Pressable>
   ```

2. **Validação de Horários** (opcional)
   - Verificar se startTime < endTime
   - Bloquear agendamentos fora dos horários disponíveis

3. **Notificações de Chamada**
   - Usar expo-notifications para alertar profissional
   - Implementar timeout para sala vazia

4. **Persistência de Room ID**
   - Salvar link da sala no modelo Appointment
   - Permitir reconexão em caso de desconexão

## 8. Estrutura de Arquivos

```
backend/
├── models/
│   └── Availability.js (NEW)
├── routes/
│   └── availability.js (NEW)
└── index.js (MODIFIED)

HealthcareApp/
├── src/
│   └── components/
│       └── AvailabilityModal.js (NEW)
├── ChatScreen.js (MODIFIED)
├── App.js (MODIFIED)
├── VideoScreen_new.js (NEW)
├── AvailabilityManagementScreen.js (NEW)
└── api.js (MODIFIED)
```

## 9. Tecnologias Utilizadas

- **Backend:** Node.js, Express, MongoDB/Mongoose, Socket.IO
- **Frontend:** React Native, Expo
- **Vídeo:** Jitsi Meet (via WebView)
- **Autenticação:** JWT
- **Navegação:** React Navigation v5+

## 10. Variáveis de Ambiente Necessárias

```
# Backend (já deve estar configurado)
MONGODB_URI=mongodb://...
JWT_SECRET=...
SOCKET_PORT=3000

# Frontend (via api.js)
API_BASE_URL=http://localhost:3000/api
```

## 11. Testes Recomendados

1. ✅ Backend: Testar endpoints de availability
2. ✅ Frontend: Renderização da tela AvailabilityManagement
3. ✅ Frontend: Abertura do modal de horários
4. ✅ Frontend: Renderização da tela VideoScreen_new
5. ⏳ E2E: Fluxo completo (paciente → profissional → chamada)
6. ⏳ Performance: Verificar delay na entrega de mensagens
7. ⏳ Jitsi: Validar conexão e qualidade de vídeo

## 12. Erros Conhecidos / Considerações

- Jitsi Meet pode ter delay de ~2-5s na inicialização
- Room ID deve ser único por chamada (timestamp é sugestão)
- Sem validação de time zones (todos em hora local)
- Sem suporte para recorrência de horários especiais

## 13. Contato para Suporte

Para dúvidas ou issues:
1. Verificar logs do backend: `console.log` em availability.js
2. Verificar erros no Expo: abrir console do dev-client
3. Testar conectividade: `fetch('/api/availability')`
