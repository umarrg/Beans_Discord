require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { Client, GatewayIntentBits, Partials, Events, PermissionsBitField } = require('discord.js');
const axios = require('axios');
const express = require('express');

const app = express();
const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,

    ],
    partials: [
        Partials.Channel,
        Partials.Message
    ]

});
const chatIds = new Set();

const telegramBot = new TelegramBot(process.env.TOKEN, { polling: true });

const telegramChatId = process.env.CHAT_ID;
telegramBot.setMyCommands([
    { command: '/start', description: 'Start the bot and get welcome message' },
    { command: '/help', description: 'Get instructions on how to use the bot' },

]);


const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
const discordChannelId = process.env.DISCORD_CHANNEL_ID;
telegramBot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    if (!chatIds.has(chatId)) {
        chatIds.add(chatId);
        console.log(`Added chatId ${chatId} to notification list.`);
    } else {
    }
    const welcomeMessage = `
    🤖 *Welcome to the Telegram-Discord Forwarder Bot* 🤖
    
    This bot forwards messages between Telegram and Discord channels seamlessly.
    
    Here are some commands to help you get started:
    - /start: Display this welcome message
    - /help: Get detailed instructions on how to use the bot
   
    `;
    telegramBot.sendMessage(msg.chat.id, welcomeMessage, { parse_mode: 'Markdown' });

});


telegramBot.onText(/\/help/, (msg) => {
    const helpMessage = `
    🛠️ *Bot Usage Instructions* 🛠️
    
    This bot forwards messages between a Telegram group and a Discord server. 
    Here’s how to use it:
    
    1. Simply type a message in this chat, and it will be forwarded to Discord.
    2. Messages from Discord will also be forwarded here.
   
    `;
    telegramBot.sendMessage(msg.chat.id, helpMessage, { parse_mode: 'Markdown' });
});
const forwardToDiscord = async (message) => {
    try {
        await axios.post(discordWebhookUrl, {
            content: message,
        });
    } catch (error) {
        console.error('Error forwarding to Discord:', error.message);
    }
};

const forwardToTelegram = async (message) => {
    try {
        for (const chatId of chatIds) {
            try {
                await telegramBot.sendMessage(chatId, message);

            } catch (error) {
                console.error(`Error sending message to chatId ${chatId}:`, error);
            }
        }
    } catch (error) {
        console.error('Error forwarding to Telegram:', error.message);
    }
};

telegramBot.on('message', (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;

    const username = msg.from.username || msg.from.first_name;
    const message = `💬 **${username}**: ${msg.text}`;

    forwardToDiscord(message)
        .then(() => console.log(`Message from Telegram forwarded to Discord: ${message}`))
        .catch(console.error);
});
bot.on('messageCreate', (message) => {

    if (message.author.bot) return;
    forwardToTelegram(message.content)
});


bot.on('error', console.log);

bot.on('ready', () => {
    console.log('FINALLYYYYYY')
})

bot.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});
bot.login(process.env.DISCORD_KEY);


telegramBot.on('polling_error', (error) => console.error('Telegram Polling Error:', error));

app.get('/', (req, res) => {
    res.send('Telegram-Discord Bot is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
