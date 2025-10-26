const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const app = express();
app.use(express.json());

const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

discordClient.login(process.env.DISCORD_TOKEN);
discordClient.on('ready', () => console.log(`Bot logado como ${discordClient.user.tag}`));

app.post('/webhook/mp', async (req, res) => {
  try {
    console.log('Recebido Mercado Pago:', req.body, req.headers);
    if (req.body.action === 'payment.updated' && req.body.type === 'payment') {
      await discordClient.channels.cache
        .get(process.env.DISCORD_CHANNEL_ID)
        .send(`Pagamento Mercado Pago atualizado! ID: ${req.body.data.id}`);
    }
    res.status(201).send('OK');
  } catch (error) {
    console.error('Erro no webhook MP:', error);
    res.status(500).send('Erro interno');
  }
});

app.post('/webhook/efi', async (req, res) => {
  try {
    console.log('Recebido Efi:', req.body);
    if (req.body.status === 'APROVADO') {
      await discordClient.channels.cache
        .get(process.env.DISCORD_CHANNEL_ID)
        .send(`Pagamento Efi aprovado! ID: ${req.body.id}`);
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro no webhook Efi:', error);
    res.status(500).send('Erro interno');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}`));
