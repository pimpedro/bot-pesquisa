/**
 * Reformata uma chave privada PEM para garantir que esteja no formato correto.
 * 
 * @param {string} privateKey - A chave privada original
 * @returns {string} A chave privada formatada corretamente
 */
function formatPrivateKey(privateKey) {
  if (!privateKey || typeof privateKey !== 'string') {
    return privateKey;
  }

  try {
    // Primeiro, remover todas as quebras de linha existentes
    let formattedKey = privateKey.replace(/\\n/g, '')
      .replace(/\n/g, '')
      .replace(/\r/g, '');
    
    // Depois, adicionar quebras de linha nos locais corretos
    formattedKey = formattedKey
      .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
      .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----\n');
    
    // Dividir o conteúdo da chave em linhas de 64 caracteres
    const keyContent = formattedKey.substring(
      formattedKey.indexOf('-----BEGIN PRIVATE KEY-----\n') + 28,
      formattedKey.indexOf('\n-----END PRIVATE KEY-----')
    );
    
    let result = '-----BEGIN PRIVATE KEY-----\n';
    for (let i = 0; i < keyContent.length; i += 64) {
      result += keyContent.substring(i, i + 64) + '\n';
    }
    result += '-----END PRIVATE KEY-----\n';
    
    return result;
  } catch (error) {
    console.error('Erro ao formatar chave privada:', error);
    return privateKey; // Retorna a chave original em caso de erro
  }
}

/**
 * Processa as credenciais do Firebase para garantir que a chave privada
 * esteja no formato correto.
 * 
 * @param {Object} credentials - O objeto de credenciais do Firebase
 * @returns {Object} As credenciais formatadas
 */
function processFirebaseCredentials(credentials) {
  if (!credentials || typeof credentials !== 'object') {
    return credentials;
  }

  try {
    const processedCredentials = { ...credentials };
    
    if (processedCredentials.private_key) {
      processedCredentials.private_key = formatPrivateKey(processedCredentials.private_key);
    }
    
    return processedCredentials;
  } catch (error) {
    console.error('Erro ao processar credenciais:', error);
    return credentials; // Retorna as credenciais originais em caso de erro
  }
}

module.exports = {
  formatPrivateKey,
  processFirebaseCredentials
}; 