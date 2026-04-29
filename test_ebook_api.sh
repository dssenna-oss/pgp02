#!/bin/bash
echo "=== Testando API do RIPD E-book ==="
echo ""
echo "1. Verificando se a API retorna o e-book..."
curl -s http://localhost:3000/api/ripd-ebook | jq '.' || echo "Erro: API não respondeu ou retornou erro"
