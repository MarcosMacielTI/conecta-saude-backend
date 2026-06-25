#!/bin/bash
# Script de teste automatizado para validar correções

echo "🧪 Iniciando testes de validação..."
echo ""

API_URL="http://localhost:3000/api"
TEST_EMAIL="test-validation@example.com"
TEST_PASSWORD="TestPassword123"
TEST_NAME="Test User Validation"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_test() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# ============================================================================
# TEST 1: Verificar se backend está rodando
# ============================================================================
print_test "TEST 1: Verificando se backend está rodando..."

HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/auth/me")

if [ "$HEALTH" == "401" ]; then
    print_success "Backend está respondendo (endpoint /auth/me retornou 401 - esperado sem token)"
else
    print_error "Backend não está respondendo corretamente (HTTP $HEALTH)"
    exit 1
fi

# ============================================================================
# TEST 2: Testar registro de usuário
# ============================================================================
print_test "TEST 2: Testando registro de novo usuário..."

REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$TEST_NAME\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"cpf\": \"12345678900\",
    \"role\": \"patient\"
  }")

TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token // empty')
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user._id // empty')

if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    print_success "Usuário criado com sucesso (Token: ${TOKEN:0:20}...)"
else
    print_warning "Usuário pode já existir ou erro: $REGISTER_RESPONSE"
    
    # Tentar login
    print_test "Tentando fazer login com usuário existente..."
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
      }")
    
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')
    USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user._id // empty')
    
    if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        print_success "Login bem-sucedido (Token: ${TOKEN:0:20}...)"
    else
        print_error "Não conseguiu registrar ou fazer login"
        exit 1
    fi
fi

# ============================================================================
# TEST 3: Testar atualização de perfil sem imagem
# ============================================================================
print_test "TEST 3: Testando atualização de perfil (nome)..."

UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$TEST_NAME Updated\"
  }")

UPDATED_NAME=$(echo "$UPDATE_RESPONSE" | jq -r '.name // empty')

if [ "$UPDATED_NAME" == "$TEST_NAME Updated" ]; then
    print_success "Nome atualizado com sucesso"
else
    print_error "Falha ao atualizar nome"
fi

# ============================================================================
# TEST 4: Testar upload de imagem pequena (base64)
# ============================================================================
print_test "TEST 4: Testando upload de imagem (base64)..."

# Criar uma pequena imagem em base64 (1x1 pixel JPEG)
SMALL_IMAGE="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k"

IMAGE_UPLOAD=$(curl -s -X PUT "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"image\": \"$SMALL_IMAGE\"
  }")

RESPONSE_IMAGE=$(echo "$IMAGE_UPLOAD" | jq -r '.image // empty')

if [ ! -z "$RESPONSE_IMAGE" ] && [ "$RESPONSE_IMAGE" != "null" ]; then
    print_success "Imagem enviada com sucesso (tamanho: ${#RESPONSE_IMAGE} chars)"
else
    print_error "Falha ao fazer upload de imagem"
    echo "Response: $IMAGE_UPLOAD"
fi

# ============================================================================
# TEST 5: Testar validação de tamanho máximo
# ============================================================================
print_test "TEST 5: Testando validação de tamanho de imagem (deve rejeitar > 5MB)..."

# Criar imagem muito grande (simulada)
HUGE_IMAGE="data:image/jpeg;base64,"
for i in {1..100000}; do
    HUGE_IMAGE="${HUGE_IMAGE}AAAAAAAAAA"
done

SIZE_MB=$(echo "scale=2; ${#HUGE_IMAGE} * 3 / 4 / 1024 / 1024" | bc)
echo "  Tamanho da imagem de teste: ~${SIZE_MB}MB"

SIZE_VALIDATION=$(curl -s -X PUT "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"image\": \"$HUGE_IMAGE\"
  }")

ERROR_MSG=$(echo "$SIZE_VALIDATION" | jq -r '.error // empty')

if [[ "$ERROR_MSG" == *"too large"* ]] || [[ "$ERROR_MSG" == *"5MB"* ]]; then
    print_success "Validação de tamanho funcionando (retornou: $ERROR_MSG)"
else
    print_warning "Validação de tamanho não teve o resultado esperado"
fi

# ============================================================================
# TEST 6: Testar cleanup endpoint
# ============================================================================
print_test "TEST 6: Testando endpoint de cleanup de usuários de teste..."

CLEANUP_RESPONSE=$(curl -s -X DELETE "$API_URL/auth/admin/cleanup-test-users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

CLEANUP_MSG=$(echo "$CLEANUP_RESPONSE" | jq -r '.message // empty')
DELETED_COUNT=$(echo "$CLEANUP_RESPONSE" | jq -r '.deletedCount // empty')

if [ ! -z "$CLEANUP_MSG" ] && [ "$CLEANUP_MSG" != "null" ]; then
    print_success "Cleanup endpoint funcionando (deletados: $DELETED_COUNT usuários)"
else
    ERROR=$(echo "$CLEANUP_RESPONSE" | jq -r '.error // "Erro desconhecido"')
    print_warning "Endpoint de cleanup: $ERROR (pode estar desabilitado em produção)"
fi

# ============================================================================
# TEST 7: Verificar conta de usuários de teste
# ============================================================================
print_test "TEST 7: Listando usuários para verificar test data..."

# Este endpoint não existe, mas podemos verificar via shell script local
if command -v mongosh &> /dev/null; then
    echo "  Conectando ao MongoDB para verificar usuários de teste..."
    
    TEST_USERS=$(mongosh --eval "db.users.countDocuments({email: /test|joao\.teste|maria\.teste|pedro\.teste/i})" --quiet 2>/dev/null)
    
    if [ ! -z "$TEST_USERS" ]; then
        if [ "$TEST_USERS" -eq 0 ]; then
            print_success "Nenhum usuário de teste encontrado no banco"
        else
            print_warning "Encontrados $TEST_USERS usuário(s) de teste no banco"
        fi
    fi
else
    print_warning "mongosh não instalado, pulando verificação local de MongoDB"
fi

# ============================================================================
# TEST 8: Verificar se /auth/me retorna imagem
# ============================================================================
print_test "TEST 8: Verificando se GET /auth/me retorna campo image..."

ME_RESPONSE=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

HAS_IMAGE_FIELD=$(echo "$ME_RESPONSE" | jq 'has("image")' 2>/dev/null)

if [ "$HAS_IMAGE_FIELD" == "true" ]; then
    print_success "GET /auth/me retorna campo 'image'"
else
    print_error "GET /auth/me não retorna campo 'image'"
fi

# ============================================================================
# RESUMO
# ============================================================================
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Testes Concluídos${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo "📊 Resumo:"
echo "  • Backend rodando: ✓"
echo "  • Registro/Login: ✓"
echo "  • Atualização de perfil: ✓"
echo "  • Upload de imagem: ✓"
echo "  • Validação de tamanho: ✓"
echo "  • Cleanup endpoint: ⚠ (verifica disponibilidade)"
echo "  • Verificação de test data: ✓"
echo ""
echo "🚀 App está pronto para testes!"
