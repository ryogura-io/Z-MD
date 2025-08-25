const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal'); // QR code generation
const Bot = require('./bot');
const logger = require('./utils/logger');
const config = require('./config');

async function startBot() {
    try {
        console.log('🤖 Starting WhatsApp Bot...');

        // Initialize authentication state
        const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

        // Create WhatsApp socket
        const sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' })),
            },
            logger: pino({ level: 'silent' }),
            browser: ['WhatsApp Bot', 'Chrome', '1.0.0'],
            generateHighQualityLinkPreview: true,
        });

        const bot = new Bot(sock);

        // Save credentials on update
        sock.ev.on('creds.update', saveCreds);

        // Connection updates
        sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr, isNewLogin }) => {
            if (qr) {
                console.log('\n📱 Scan this QR code with WhatsApp:');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
                logger.info('Connection closed due to:', lastDisconnect?.error, ', reconnecting:', shouldReconnect);

                if (shouldReconnect) startBot();
            } else if (connection === 'open') {
                logger.info('✅ WhatsApp bot connected successfully!');

                const ownerNumber = config.get('ownerNumber'); // must include @s.whatsapp.net
                if (ownerNumber) {
                    const timestamp = new Date().toLocaleString();
                    const msg = `✅ *Bot Connected!*\n\n` +
                        `🤖 WhatsApp Bot is online\n` +
                        `⏰ Connected at: ${timestamp}\n` +
                        `📱 Status: Ready\n\n` +
                        `Type ${config.get('prefix')}help for commands.`;

                    setTimeout(async () => {
                        try {
                            await sock.sendMessage(ownerNumber, { text: msg });
                            logger.info('Success message sent to owner');
                        } catch (err) {
                            logger.error('Failed to send message to owner:', err);
                        }
                    }, 2000);
                }
            }
        });

        // Messages
        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            if (!msg.message || msg.message.protocolMessage) return; // ignore non-chat messages

            try {
                // Get sender JID (WhatsApp ID)
                const sender = msg.key.participant || msg.key.remoteJid;

                // Get emoji for this sender from config
                const emoji = config.getNumberEmoji(sender);

                // If the sender is in the emoji map, react to their message
                if (emoji) {
                    await sock.sendMessage(msg.key.remoteJid, {
                        react: {
                            text: emoji,
                            key: msg.key
                        }
                    });
                }

                // Pass the message to your bot logic
                await bot.handleMessage(m);

            } catch (err) {
                console.error("Error handling message:", err);
            }
        });

        // Group updates
        sock.ev.on('groups.update', async (g) => await bot.handleGroupUpdate(g));
        sock.ev.on('group-participants.update', async (u) => await bot.handleParticipantsUpdate(u));

    } catch (error) {
        logger.error('❌ Error starting bot:', error);
        setTimeout(startBot, 5000);
    }
}

startBot();

process.on('SIGINT', () => { logger.info('Bot shutting down...'); process.exit(0); });
process.on('uncaughtException', (err) => logger.error('Uncaught Exception:', err));
process.on('unhandledRejection', (reason, promise) => logger.error('Unhandled Rejection at:', promise, 'reason:', reason));

// === Keep Alive Server ===
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Root route
app.get("/", (req, res) => {
  res.send("✅ Gura-io bot is alive!");
});

// Start server (important: bind to 0.0.0.0 for Render)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Keep-alive server running on port ${PORT}`);
});
