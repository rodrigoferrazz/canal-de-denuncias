# Email Backend (Node.js)

Este mini-backend recebe requisições do seu formulário e envia emails pela conta do Gmail usando a API do Google.

## 🚀 Como rodar

1. Instale as dependências:
```bash
npm install
```

2. Configure o arquivo `index.js` com suas credenciais:
   - `CLIENT_ID`
   - `CLIENT_SECRET`
   - `REDIRECT_URI`
   - `REFRESH_TOKEN`

3. Execute o servidor:
```bash
node index.js
```

O servidor irá rodar (por padrão) na porta 4000.

---
## 🔑 Como obter o refresh token do Gmail

1. Acesse o [OAuth2 Playground](https://developers.google.com/oauthplayground)
2. Clique no ícone de "Configurações" no canto superior direito e marque o checkbox: "Use your own OAuth credentials" e preencha com seu `CLIENT_ID` e `CLIENT_SECRET`.
3. No campo Step 1, busque por e selecione `https://mail.google.com/` (ou só `gmail.send` se desejar apenas enviar emails)
4. Clique em "Authorize APIs" e faça login com a conta desejada.
5. Clique em "Exchange authorization code for tokens"
6. Copie o valor do `refresh_token` e cole no arquivo `index.js`

---

## 🌐 Endpoint

- **POST /enviar-email**
- Conteúdo JSON:
```json
{
  "text": "Mensagem ou relato do formulário",
  "timestamp": "2024-07-03T15:04:05.000Z"
}
```
- Resposta: `{ success: true, message: 'Email enviado!' }` ou erro

### Exemplo CURL
```bash
curl -X POST http://localhost:4000/enviar-email \
  -H "Content-Type: application/json" \
  -d '{ "text": "teste mensagem", "timestamp": "2024-07-03T15:04:05.000Z" }'
```

---

Qualquer dúvida, basta perguntar! O frontend deve fazer requisições para este endpoint para acionar o envio de email automático.
