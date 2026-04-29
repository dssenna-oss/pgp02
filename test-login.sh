#!/bin/bash

# Testar login diretamente
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "clubedoservidor@protonmail.com",
    "password": "741963PgP@*#$",
    "csrfToken": "test"
  }' \
  -c cookies.txt \
  -b cookies.txt \
  -v

echo ""
echo "Verificando cookies:"
cat cookies.txt
