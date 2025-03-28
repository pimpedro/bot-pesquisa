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

## Deploy no Render

Para fazer o deploy do bot no Render, você tem duas opções para configurar as credenciais do Firebase:

### Opção 1: Usar o arquivo de credenciais (Recomendado)

1. Obtenha o arquivo JSON de credenciais do Firebase:

   - Acesse o [Console do Firebase](https://console.firebase.google.com/)
   - Selecione seu projeto
   - Clique em "⚙️ Configurações" > "Configurações do projeto"
   - Vá para a aba "Contas de serviço"
   - Clique em "Gerar nova chave privada"
   - Baixe o arquivo JSON

2. Codifique o arquivo em base64:

   ```bash
   base64 -i firebase-credentials.json
   ```

   Copie todo o texto de saída.

3. No dashboard do Render:
   - Configure o serviço para usar o seguinte Build Command:
     ```bash
     npm install && ./render-build.sh
     ```
   - Configure o Start Command:
     ```bash
     npm start
     ```
   - Adicione a variável de ambiente `FIREBASE_CREDENTIALS_BASE64` com o conteúdo base64 copiado anteriormente

O script `render-build.sh` irá:

- Decodificar o conteúdo base64
- Salvar como um arquivo JSON em `config/firebase-credentials.json`
- O bot usará automaticamente este arquivo em vez da variável de ambiente

### Opção 2: Usar a variável de ambiente

Se preferir não usar o arquivo, você pode:

1. Adicionar a variável de ambiente `FIREBASE_CREDENTIALS` com o conteúdo completo do arquivo JSON.

2. O bot tentará usar esta variável caso não encontre o arquivo de credenciais.

## Solução de Problemas

Se encontrar o erro `Failed to parse private key: Error: Invalid PEM formatted message`, tente:

1. Usar a Opção 1 (arquivo de credenciais) descrita acima
2. Verificar se o JSON está corretamente formatado
3. Se usar a variável de ambiente, certifique-se de que não há aspas extras ao redor do valor
