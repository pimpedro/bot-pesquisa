# Bot do Slack para Pesquisa

Este bot do Slack permite consultar e analisar pesquisas armazenadas no Firebase.

## Configuração

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env` com as seguintes variáveis:
   ```
   SLACK_BOT_TOKEN=seu-token-do-slack
   SLACK_SIGNING_SECRET=seu-secret-do-slack
   FIREBASE_CREDENTIALS=suas-credenciais-do-firebase
   OPENAI_API_KEY=sua-chave-da-api-openai
   ```

## Uso

Para iniciar o bot:

```bash
npm start
```

O bot responderá a menções no Slack com análises das pesquisas disponíveis.
