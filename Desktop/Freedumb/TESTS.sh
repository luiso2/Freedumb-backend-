#!/bin/bash

# Script de pruebas para la API de Finance Agent
# Asegúrate de tener el servidor corriendo antes de ejecutar este script

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables de configuración
BASE_URL="http://localhost:3000"
API_KEY="freedumb-finance-api-key-2025"

echo -e "${YELLOW}=== Finance Agent API Tests ===${NC}\n"

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check (GET /)${NC}"
curl -s "$BASE_URL/" | jq '.'
echo -e "\n"

# Test 2: Registrar un gasto
echo -e "${YELLOW}Test 2: Registrar gasto (POST /transactions)${NC}"
GASTO_RESPONSE=$(curl -s -X POST "$BASE_URL/transactions" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "gasto",
    "amount": 45.50,
    "card": "Visa 002",
    "description": "Gasolina",
    "category": "transporte"
  }')
echo "$GASTO_RESPONSE" | jq '.'
GASTO_ID=$(echo "$GASTO_RESPONSE" | jq -r '.data._id')
echo -e "${GREEN}Gasto ID: $GASTO_ID${NC}\n"

# Test 3: Registrar un ingreso
echo -e "${YELLOW}Test 3: Registrar ingreso (POST /transactions)${NC}"
curl -s -X POST "$BASE_URL/transactions" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ingreso",
    "amount": 2500,
    "description": "Salario mensual",
    "category": "salario"
  }' | jq '.'
echo -e "\n"

# Test 4: Listar todas las transacciones
echo -e "${YELLOW}Test 4: Listar transacciones (GET /transactions)${NC}"
curl -s "$BASE_URL/transactions?limit=10" \
  -H "x-api-key: $API_KEY" | jq '.'
echo -e "\n"

# Test 5: Obtener resumen
echo -e "${YELLOW}Test 5: Obtener resumen (GET /summary)${NC}"
curl -s "$BASE_URL/summary" \
  -H "x-api-key: $API_KEY" | jq '.'
echo -e "\n"

# Test 6: Filtrar solo gastos
echo -e "${YELLOW}Test 6: Filtrar gastos (GET /transactions?type=gasto)${NC}"
curl -s "$BASE_URL/transactions?type=gasto&limit=5" \
  -H "x-api-key: $API_KEY" | jq '.'
echo -e "\n"

# Test 7: Eliminar transacción
if [ ! -z "$GASTO_ID" ] && [ "$GASTO_ID" != "null" ]; then
  echo -e "${YELLOW}Test 7: Eliminar transacción (DELETE /transactions/$GASTO_ID)${NC}"
  curl -s -X DELETE "$BASE_URL/transactions/$GASTO_ID" \
    -H "x-api-key: $API_KEY" | jq '.'
  echo -e "\n"
else
  echo -e "${RED}Test 7: No se pudo eliminar (ID no válido)${NC}\n"
fi

# Test 8: Test de autenticación fallida
echo -e "${YELLOW}Test 8: Autenticación fallida (API Key incorrecta)${NC}"
curl -s "$BASE_URL/transactions" \
  -H "x-api-key: wrong-key" | jq '.'
echo -e "\n"

echo -e "${GREEN}=== Tests completados ===${NC}"
