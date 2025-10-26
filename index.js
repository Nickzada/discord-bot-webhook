const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const app = express();

// Configurar JSON para receber payloads
app.use(express.json());

// Bot do Discord
const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});
discordClient.login('MTQwNDU5MDcyOTc3MDMwMzQ5OQ.Gff2vL.IAvyPD2WbP4I6yk-g96qu4kRtrS6Fvyk-wp3Gs'); // Substitua pelo token do bot no Discord Developer Portal

discordClient.on('ready', () => {
  console.log(`Bot logado como ${discordClient.user.tag}`);
});

// Webhook para Mercado Pago
app.post('/webhook/mp', (req, res) => {
  console.log('Recebido MP:', req.body);
  if (req.body.action === 'payment.updated' && req.body.type === 'payment') {
    // Simulação: Consultar status do pagamento (use SDK do Mercado Pago aqui)
    discordClient.channels.cache
      .get('1419822465110118430') // Substitua pelo ID do canal do Discord
      .send(`Pagamento Mercado Pago atualizado! ID: ${req.body.data.id}`);
  }
  res.status(201).send('OK');
});

// Webhook para Efi
app.post('/webhook/efi', (req, res) => {
  console.log('Recebido Efi:', req.body);
  if (req.body.status === 'APROVADO') {
    discordClient.channels.cache
      .get('1419822465110118430') // Substitua pelo ID do canal do Discord
      .send(`Pagamento Efi aprovado! ID: ${req.body.id}`);
  }
  res.status(200).send('OK');
});

// No final do index.js, altere para:
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});