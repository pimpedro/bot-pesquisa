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

## Scripts de Utilidade

Na pasta `scripts/` você encontrará os seguintes utilitários:

### Importação de Transcripts

```bash
node scripts/import_transcripts.js
```

Importa os arquivos de transcript da pasta `transcripts/` para o Firestore, gerando embeddings para cada pesquisa.

### Geração de Embeddings

```bash
node scripts/generate_embeddings.js
```

Gera embeddings para pesquisas que ainda não possuem, usando o modelo text-embedding-ada-002.

### Geração de Resumos

```bash
node scripts/generate_resumos.js
```

Gera resumos concisos para as pesquisas usando GPT-3.5-turbo.

## Solução de Problemas

### Credenciais do Firebase

Se você estiver usando variáveis de ambiente para as credenciais do Firebase, certifique-se que:

1. O valor é um JSON válido (sem aspas extras no início e fim)
2. Se estiver implantando em uma plataforma como Render, a chave privada pode precisar de tratamento especial:

   **Formato incorreto:**

   ```
   "private_key": "-----BEGIN PRIVATE KEY-----\\nABC...XYZ\\n-----END PRIVATE KEY-----\\n"
   ```

   **Formato correto:**

   ```
   "private_key": "-----BEGIN PRIVATE KEY-----\nABC...XYZ\n-----END PRIVATE KEY-----\n"
   ```

   O código foi modificado para tratar automaticamente essas quebras de linha, mas certifique-se de que o resto do JSON está correto.
