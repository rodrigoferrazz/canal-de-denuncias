require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', false); // não confiar em proxies para não ler X-Forwarded-For

// CORS: em produção, use variável FRONTEND_URL para segurança
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',')
  : true; // em desenvolvimento, permite todos
app.use(cors({ 
  origin: allowedOrigins, 
  methods: ['POST', 'OPTIONS'],
  credentials: false
}));
app.use(express.json({ limit: '200kb' }));

// Headers de segurança essenciais
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'interest-cohort=()');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  // Remover cabeçalhos potencialmente sensíveis
  delete req.headers['x-forwarded-for'];
  delete req.headers['x-real-ip'];
  next();
});

// ------- CREDENCIAIS GOOGLE (use variáveis de ambiente em produção) -------
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// ------- SUPABASE (use service role key para inserir mesmo com RLS) -------
const SUPABASE_URL = process.env.SUPABASE_URL || 'COLE_AQUI_SUPABASE_URL';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'COLE_AQUI_SERVICE_ROLE_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const encodedSubject = (text) => `=?UTF-8?B?${Buffer.from(text, 'utf-8').toString('base64')}?=`;

async function enviarEmail({ text, timestamp }) {
  const emailContent = `Relato: ${text}\nData: ${timestamp}`;
  const subject = 'Mensagem do canal de denúncia';
  const rawMessage = [
    'To: rodrigo.ferraz@sou.inteli.edu.br',
    `Subject: ${encodedSubject(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    emailContent
  ].join('\r\n');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: Buffer.from(rawMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    }
  });
}

// Rota única: salva no Supabase e envia e-mail
app.post('/relato', async (req, res) => {
  try {
    const { text, timestampISO, timestampDisplay } = req.body || {};
    if (!text || !timestampISO || !timestampDisplay) {
      return res.status(400).json({ error: 'text, timestampISO e timestampDisplay são obrigatórios' });
    }

    // 1) Inserir no Supabase com horário ISO (UTC)
    const { error: insertError } = await supabase
      .from('canal-de-denuncias')
      .insert([{ text: String(text).trim(), created_at: String(timestampISO) }]);

    if (insertError) {
      return res.status(500).json({ error: 'Falha ao salvar no Supabase', details: insertError.message });
    }

    // 2) Enviar e-mail com horário formatado para exibição
    await enviarEmail({ text: String(text).trim(), timestamp: String(timestampDisplay) });

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao processar relato', details: err?.message });
  }
});

// Rota antiga mantém compatibilidade, faz proxy para o fluxo novo se necessário
app.post('/enviar-email', async (req, res) => {
  const { text, timestamp } = req.body || {};
  if (!text || !timestamp) return res.status(400).json({ error: 'text e timestamp são obrigatórios' });
  try {
    await enviarEmail({ text, timestamp });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao enviar email', details: e?.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  // Não logar IPs/headers; apenas um log simples de porta
  console.log(`Servidor rodando na porta ${PORT}`);
});
