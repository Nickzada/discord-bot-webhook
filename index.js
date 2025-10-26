const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const https = require('https');
require('dotenv').config();

const app = express();

// Configurar JSON para receber payloads
app.use(express.json());

// Middleware para validação mTLS (simplificado; expanda conforme documentação da Efi)
app.use('/webhook/efi', (req, res, next) => {
  // Nota: No Render, HTTPS é gerenciado automaticamente. Para mTLS completo, use certificados
  // Verifique o certificado do cliente (exemplo básico, expanda com Efi CA)
  try {
    const cert = req.socket.getPeerCertificate();
    if (!cert || !cert.subject || !cert.subject.CN.includes('efipay.com.br')) {
      console.warn('mTLS inválido:', cert?.subject || 'Sem certificado');
      return res.status(403).send('mTLS inválido');
    }
    next();
  } catch (error) {
    console.error('Erro na validação mTLS:', error);
    res.status(403).send('Erro na validação mTLS');
  }
});

// Configurar o bot do Discord
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Evento de login do bot
discordClient.on('ready', () => {
  console.log(`Bot logado como ${discordClient.user.tag}`);
});

// Evento de erro do bot
discordClient.on('error', (error) => {
  console.error('Erro no bot:', error);
});

// Login no Discord
discordClient.login(process.env.DISCORD_TOKEN).catch((error) => {
  console.error('Erro ao logar no Discord:', error);
});

// Webhook para Efi (Efí Pay)
app.post('/webhook/efi', async (req, res) => {
  try {
    console.log('Recebido Efi:', req.body, req.headers);
    const { id, status, valor } = req.body; // Payload: { id: 'pag_123', status: 'APROVADO', valor: 100.00, ... }
    if (!id || !status) {
      console.warn('Payload inválido:', req.body);
      return res.status(400).send('Payload inválido');
    }
    if (status === 'APROVADO') {
      await discordClient.channels.cache
        .get(process.env.DISCORD_CHANNEL_ID)
        .send(`Pagamento Efi aprovado! ID: ${id}. Valor: R$${valor || 'N/A'}`)
        .catch((error) => {
          console.error('Erro ao enviar mensagem no Discord:', error);
        });
    }
    res.status(200).send('OK'); // Efi exige 200 para confirmar recebimento
  } catch (error) {
    console.error('Erro no webhook Efi:', error);
    res.status(500).send('Erro interno');
  }
});

// Webhook para Mercado Pago (opcional, caso queira usar)
app.post('/webhook/mp', async (req, res) => {
  try {
    console.log('Recebido Mercado Pago:', req.body, req.headers);
    const { action, type, data } = req.body; // Payload: { action: 'payment.updated', type: 'payment', data: { id: '123' } }
    if (action === 'payment.updated' && type === 'payment' && data?.id) {
      // Para consultar detalhes, adicione o SDK do Mercado Pago
      await discordClient.channels.cache
        .get(process.env.DISCORD_CHANNEL_ID)
        .send(`Pagamento Mercado Pago atualizado! ID: ${data.id}`)
        .catch((error) => {
          console.error('Erro ao enviar mensagem no Discord:', error);
        });
    }
    res.status(201).send('OK'); // Mercado Pago espera 201
  } catch (error) {
    console.error('Erro no webhook MP:', error);
    res.status(500).send('Erro interno');
  }
});

// Rota de teste para verificar se o servidor está online
app.get('/', (req, res) => {
  res.send('Servidor de webhooks ativo!');
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
