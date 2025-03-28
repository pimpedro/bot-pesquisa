#!/bin/bash

# Script de build para o Render

echo "Iniciando script de build..."

# Verificar se a variável de ambiente de credenciais está definida
if [ -n "$FIREBASE_CREDENTIALS_BASE64" ]; then
  echo "FIREBASE_CREDENTIALS_BASE64 encontrada, decodificando..."
  # Decodificar o arquivo base64 em config/firebase-credentials.json
  mkdir -p config
  echo "$FIREBASE_CREDENTIALS_BASE64" | base64 -d > config/firebase-credentials.json
  echo "Arquivo de credenciais criado com sucesso em config/firebase-credentials.json"
  
  # Verificar se o arquivo foi criado corretamente
  if [ -f "config/firebase-credentials.json" ]; then
    echo "✅ Arquivo de credenciais verificado"
    # Exibir primeiros caracteres para debug (sem revelar toda a chave)
    head -c 100 config/firebase-credentials.json
    echo "..."
  else
    echo "❌ Falha ao criar o arquivo de credenciais"
  fi
else
  echo "FIREBASE_CREDENTIALS_BASE64 não encontrada, usando credenciais da variável de ambiente FIREBASE_CREDENTIALS"
fi

echo "Script de build concluído." 