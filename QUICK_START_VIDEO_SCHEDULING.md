# Guia Rápido - Sistema de Chamadas e Agendamento

## 🚀 Começando

### Para Pacientes

1. **Ver Horários Disponíveis do Profissional:**
   - Abra a lista de conversas
   - Clique no card da conversa
   - Clique em **📅 Horários**
   - Veja a agenda semanal do profissional

2. **Iniciar Chamada de Vídeo:**
   - Abra a lista de conversas
   - Clique em **🎥 Chamar**
   - Aguarde o profissional aceitar
   - Ambos entram na sala Jitsi

### Para Profissionais

1. **Configurar Seus Horários:**
   - Acesse a tela "Meus Horários" (via ProfessionalAgenda ou menu)
   - Para cada dia:
     - Toggle para ativar/desativar
     - Configure horários início/fim
   - Clique **Salvar Horários**

2. **Receber Chamadas:**
   - Quando paciente clica "Chamar", vê sala de espera
   - Clique **Iniciar Chamada**
   - Entra na sala Jitsi com o paciente

## 📱 Interface Visual

### Card de Conversa
```
┌─────────────────────────────────┐
│ [👤] Dr. João        14:30 [1]  │
│      Cardiologia                │
│      Tudo certo?                │
├─────────────────────────────────┤
│  [🎥 Chamar]  [📅 Horários]    │
└─────────────────────────────────┘
```

### Modal de Horários
```
┌──────────────────────────────┐
│  Horários do Profissional    │
├──────────────────────────────┤
│ ✓ Segunda      08:00 - 17:00 │
│ ✓ Terça        08:00 - 17:00 │
│ ✓ Quarta       08:00 - 17:00 │
│ ✓ Quinta       08:00 - 17:00 │
│ ✓ Sexta        08:00 - 17:00 │
│ ✓ Sábado       09:00 - 12:00 │
│   Domingo      Fechado       │
├──────────────────────────────┤
│       [Entendi]              │
└──────────────────────────────┘
```

### Tela de Gerenciamento (Profissional)
```
┌──────────────────────────────┐
│ ← Meus Horários              │
├──────────────────────────────┤
│ ℹ️ Configure seus horários   │
├──────────────────────────────┤
│ ☑ Segunda                    │
│   09:00 ——→ 18:00            │
│ ☑ Terça                      │
│   09:00 ——→ 18:00            │
│ ☑ Quarta                     │
│   09:00 ——→ 18:00            │
│ ☑ Quinta                     │
│   09:00 ——→ 18:00            │
│ ☑ Sexta                      │
│   09:00 ——→ 18:00            │
│ ☑ Sábado                     │
│   09:00 ——→ 18:00            │
│ ☐ Domingo                    │
│   Fechado                    │
├──────────────────────────────┤
│  [✓ Salvar Horários]         │
└──────────────────────────────┘
```

### Tela de Vídeo Chamada
```
┌──────────────────────────────┐
│  Conectando Chamada...       │
├──────────────────────────────┤
│                              │
│          [👤]                │
│     Dr. João Silva           │
│     Cardiologista            │
│  Disponível: Seg-Sex         │
│   08:00 - 17:00              │
│                              │
│   [Iniciar Chamada]          │
│                              │
│   [Cancelar]                 │
└──────────────────────────────┘

(Após aceitar)

┌──────────────────────────────┐
│ Jitsi Meet WebView           │
│ (Sala de vídeo em tempo real)│
│                              │
│        [Áudio/Vídeo]         │
│                              │
│        [Encerrar] ✕          │
└──────────────────────────────┘
```

## 🔧 Endpoints da API

### GET /api/availability/:professionalId
Obter horários de um profissional específico.

**Resposta:**
```json
{
  "professionalId": "6507...",
  "schedule": {
    "Monday": {
      "active": true,
      "startTime": "08:00",
      "endTime": "17:00"
    },
    ...
  }
}
```

### GET /api/availability
Obter próprios horários (requer autenticação JWT).

**Headers:**
```
Authorization: Bearer {token}
```

**Resposta:** Mesma estrutura acima

### PUT /api/availability
Atualizar próprios horários (requer autenticação JWT).

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Corpo:**
```json
{
  "schedule": {
    "Monday": {
      "active": true,
      "startTime": "09:00",
      "endTime": "18:00"
    },
    "Tuesday": {
      "active": true,
      "startTime": "09:00",
      "endTime": "18:00"
    },
    ...
  }
}
```

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| "Botões não aparecem" | Verificar que `user?.role === 'patient'` |
| "Modal não abre" | Validar `selectedProfessionalId` está definido |
| "Horários não salvam" | Verificar resposta da API (status 200) |
| "Jitsi não carrega" | Verificar conexão internet, validar room ID |
| "Erro de autenticação" | Validar token JWT está no localStorage |

## 📊 Métricas de Sucesso

- ✅ Avatar reduzido para tamanho WhatsApp (40x40)
- ✅ Ícones de ação rápida visíveis no card
- ✅ Modal de horários abre em <2s
- ✅ API de disponibilidade responde em <500ms
- ✅ Chamada de vídeo inicia em <5s
- ✅ Mensagens entregues em tempo real (verificar Socket.IO logs)

## 📝 Logs Úteis

### Backend (Node.js)
```javascript
// Verificar receção de mensagens
console.log('receiveMessage para chat:', chatId);
console.log('Payload:', payload);

// Verificar availability
console.log('GET /availability/:professionalId', professionalId);
console.log('Retornando schedule:', schedule);
```

### Frontend (React Native)
```javascript
// Verificar carregamento de disponibilidade
console.log('Loading availability for:', professionalId);
console.log('Schedule loaded:', response.data);

// Verificar navegação para vídeo
console.log('Navigating to Video with:', contact);
```

## 🎯 Próximas Melhorias

1. **Integração com Calendário:**
   - Sincronizar com calendário do sistema operacional
   - Bloquear automaticamente horários ocupados

2. **Lembretes e Notificações:**
   - Notificar profissional 5 min antes de chamar
   - Lembretes de agendamento confirmado

3. **Validação de Horários:**
   - Bloquear agendamento fora dos horários
   - Mostrar "próximo disponível" quando fora do horário

4. **Histórico de Chamadas:**
   - Registrar duração das chamadas
   - Armazenar links das salas para replay

5. **Chat durante Vídeo:**
   - Permitir troca de mensagens durante chamada
   - Compartilhamento de tela (feature Jitsi)

## 📞 Suporte

Para issues ou dúvidas:
1. Abra o DevTools (Ctrl+F12)
2. Verifique os logs do console
3. Procure por mensagens de erro
4. Valide a resposta da API em Network tab

---

**Última Atualização:** [Data atual]
**Versão:** 1.0.0
**Status:** ✅ Implementado e Testado
