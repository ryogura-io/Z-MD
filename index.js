const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys'); 
const pino = require('pino');
const qrcode = require('qrcode-terminal'); 
const Bot = require('./bot');
const config = require('./config');
const express = require("express");
const fs = require("fs");
const { Boom } = require('@hapi/boom');

async function startBot() {
    try {
        console.log('🤖 Starting WhatsApp Bot...');

        const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

        const sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' })),
            },
            logger: pino({ level: 'silent' }),
            syncFullHistory: false,
            browser: ['WhatsApp Bot', 'Chrome', '1.0.0'],
            generateHighQualityLinkPreview: true,
        });

        const bot = new Bot(sock);

        sock.ev.on('creds.update', saveCreds);

        // --- Connection Handling ---
        sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
            if (qr) {
                console.log('\n📱 Scan this QR code with WhatsApp:');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                console.info('Connection closed. Code:', reason);

                if (reason === DisconnectReason.badSession) {
                    console.log("❌ Bad session detected. Deleting session folder...");
                    fs.rmSync("./auth_info", { recursive: true, force: true });
                    return startBot();
                }

                if (reason === DisconnectReason.loggedOut) {
                    console.log("🚪 Logged out. Not reconnecting.");
                    return;
                }

                if (!sock.__reconnectTried) {
                    sock.__reconnectTried = true;
                    console.log("⚡ Reconnecting (once)...");
                    startBot();
                } else {
                    console.log("⛔ Reconnection disabled after first attempt.");
                }

            } else if (connection === 'open') {
                console.info('✅ WhatsApp bot connected successfully!');

                const owners = config.ownerNumber || [];
                if (owners.length > 0 && !sock.__welcomeSent) {
                    const firstOwner = owners[0];
                    const msg = `✅ *Bot Connected!*\n\n` +
                        `🤖 WhatsApp Bot is online\n` +
                        `⏰ Connected at: ${new Date().toLocaleString()}\n` +
                        `📱 Status: Ready\n\n` +
                        `Type ${config.prefix}help for commands.`;

                    try {
                        await sock.sendMessage(firstOwner, { text: msg });
                        console.info(`✅ Success message sent to first owner: ${firstOwner}`);
                        sock.__welcomeSent = true; // prevent spamming
                    } catch (err) {
                        console.error(`❌ Failed to send message to ${firstOwner}:`, err);
                    }
                }
            }
        });

        // --- Message Handling ---
        sock.ev.on('messages.upsert', async (m) => {
            try {
                const msg = m.messages[0];
                if (!msg.message) return;
                if (msg.key.fromMe) return; // 🚫 ignore bot’s own messages
                if (msg.message.protocolMessage) return;

                const sender = msg.key.participant || msg.key.remoteJid;
                const emoji = config.getNumberEmoji(sender);

                if (emoji) {
                    await sock.sendMessage(msg.key.remoteJid, {
                        react: { text: emoji, key: msg.key }
                    });
                }

                await bot.handleMessage(m);
            } catch (err) {
                if (String(err).includes("Bad MAC")) {
                    console.log("⚠️ Bad MAC detected. Clearing session...");
                    fs.rmSync("./auth_info", { recursive: true, force: true });
                    return startBot();
                }
                console.error("❌ Error handling message:", err.message || err);
            }
        });

        // --- Group events ---
        sock.ev.on('groups.update', async (g) => {
            try { await bot.handleGroupUpdate(g); }
            catch (err) { console.error("❌ Group update error:", err); }
        });

        sock.ev.on('group-participants.update', async (u) => {
            try { await bot.handleParticipantsUpdate(u); }
            catch (err) { console.error("❌ Participants update error:", err); }
        });

    } catch (error) {
        console.error('❌ Error starting bot:', error);
    }
}

// === Keep Alive Server ===
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("✅ Gura-io bot is alive!");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Keep-alive server running on port ${PORT}`);
  startBot();
});

// === Graceful shutdown handlers ===
process.on('SIGINT', () => { console.info('Bot shutting down...'); process.exit(0); });
process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (reason, promise) => console.error('Unhandled Rejection at:', promise, 'reason:', reason));
