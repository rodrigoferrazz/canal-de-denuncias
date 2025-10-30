import { google } from 'googleapis';

// Configurações do OAuth 2.0
const CLIENT_ID = '1062709224455-utn62fg360f899baom6oijetbkga38nb.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:3001/';

// Scopes necessários para enviar emails
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

// Configurar OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Função para obter URL de autorização
export const getAuthUrl = (): string => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
};

// Função para trocar código por tokens
export const getTokens = async (code: string) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (error) {
    console.error('Erro ao obter tokens:', error);
    throw error;
  }
};

// Função para configurar tokens (quando já temos refresh token)
export const setTokens = (tokens: any) => {
  oauth2Client.setCredentials(tokens);
};

// Função para enviar email
export const sendEmail = async (text: string, timestamp: string): Promise<boolean> => {
  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Criar o email
    const emailContent = `Relato: ${text}\nData: ${timestamp}`;
    
    const message = {
      raw: Buffer.from(
        `To: rodrigo.ferraz@sou.inteli.edu.br\r\n` +
        `Subject: Mensagem do canal de denúncia\r\n` +
        `Content-Type: text/plain; charset=utf-8\r\n` +
        `\r\n` +
        `${emailContent}`
      ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    };

    // Enviar email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: message
    });

    console.log('Email enviado com sucesso:', response.data);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
};

// Função para verificar se temos tokens válidos
export const hasValidTokens = (): boolean => {
  const credentials = oauth2Client.credentials;
  return !!(credentials.access_token || credentials.refresh_token);
};

// Função para obter URL de autorização com estado
export const getAuthUrlWithState = (state: string): string => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: state
  });
};

