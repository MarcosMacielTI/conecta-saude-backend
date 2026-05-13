#!/bin/bash
# Script para testar conexão com backend remoto
# Uso: bash test-backend.sh https://seu-projeto.up.railway.app

BACKEND_URL=${1:-"http://localhost:3000"}

echo "🧪 Testando Backend: $BACKEND_URL"
echo ""

# Teste 1: Health check
echo "✓ Teste 1: Health Check"
curl -s "$BACKEND_URL/api" 2>&1 | head -20
echo ""
echo ""

# Teste 2: GET /professionals (sem autenticação)
echo "✓ Teste 2: Listar profissionais"
curl -s "$BACKEND_URL/api/professionals" 2>&1 | head -20
echo ""
echo ""

# Teste 3: Status código
echo "✓ Teste 3: Status HTTP"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/professionals")
echo "Status: $STATUS"
if [ $STATUS -eq 200 ] || [ $STATUS -eq 401 ]; then
    echo "✅ Backend está respondendo corretamente!"
else
    echo "❌ Backend retornou erro: $STATUS"
    echo "   Se 000: Backend está offline ou URL está errada"
fi
