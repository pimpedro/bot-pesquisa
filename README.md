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

### Credenciais do Firebase no Render

Para configurar corretamente as credenciais do Firebase no Render:

1. Acesse o console do Firebase e baixe o arquivo JSON de chave privada do seu projeto.

2. No dashboard do Render, vá para seu serviço web e acesse a aba "Environment".

3. Adicione uma variável chamada `FIREBASE_CREDENTIALS`.

4. Cole o conteúdo **completo** do arquivo JSON baixado, sem aspas extras ao redor do valor.

O bot inclui uma função de formatação da chave privada que lida automaticamente com problemas comuns de formato encontrados em plataformas de hospedagem, como quebras de linha incorretas.

### Verificação das Credenciais

Para garantir que suas credenciais estão no formato correto:

1. O valor deve ser um JSON válido.
2. Não adicione aspas extras no início e fim do valor.
3. A chave privada deve estar no formato PEM correto.

Se persistirem problemas, tente estas soluções:

1. Substituir manualmente a chave privada no formato correto:

   ```
   "private_key": "-----BEGIN PRIVATE KEY-----\nABC...XYZ\n-----END PRIVATE KEY-----\n"
   ```

2. Para o Render, você também pode tentar definir a variável de ambiente usando a CLI:
   ```bash
   render env set FIREBASE_CREDENTIALS="$(cat firebase-credentials.json)" --service seu-servico
   ```
