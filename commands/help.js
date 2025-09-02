const config = require('../config');
const fs = require('fs');

const helpCommand = {
    help: {
        description: 'Show available commands',
        usage: 'help [command]',
        aliases: ['h', 'commands', 'menu'],
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            const prefix = config.get('prefix');
            
            if (args.length > 0) {
                // Show help for specific command
                const commandName = args[0].toLowerCase();
                const commands = require('./index');
                
                if (commands[commandName]) {
                    const cmd = commands[commandName];
                    const helpText = `📚 *${commandName.toUpperCase()} Command Help*\n\n` +
                        `*Description:* ${cmd.description}\n` +
                        `*Usage:* ${prefix}${cmd.usage}\n` +
                        `*Aliases:* ${cmd.aliases ? cmd.aliases.join(', ') : 'None'}\n` +
                        `*Admin Only:* ${cmd.adminOnly ? 'Yes' : 'No'}`;
                    
                    await bot.sendMessage(chatId, helpText);
                } else {
                    await bot.sendMessage(chatId, `❌ Command '${commandName}' not found.`);
                }
            } else {
                // Show all commands organized by category
                try {
                    const commands = require('./index');
                    let helpText = `✨ *${config.get('ownerName')} WhatsApp Bot Commands (${Object.keys(commands).length} total)*\n\n`;
                    
                    // Categorize commands
                    const categories = {
                        '🏓 Basic': ['help', 'ping', 'locked'],
                        '🛠️ Utility': ['tts', 'owner', 'joke', 'fact', 'quote', 'weather', 'define', 'lyrics', 'movie', 'anime', 'url', 'tiny'],
                        '🎨 Media': ['sticker', 'toimg', 'vv', 'tomp3'],
                        '🎮 Games': ['hangman', 'trivia', 'truth', 'dare', 'a'],
                        '⬇️ Downloads': ['play', 'facebook', 'instagram', 'tiktok', 'youtube', 'spotify', 'image', 'waifu'],
                        '👥 Group': ['promote', 'demote', 'kick', 'add', 'setname', 'setdesc', 'close', 'open', 'tag', 'tagall', 'admins', 'resetlink', 'groupinfo', 'link']
                    };
                    
                    Object.keys(categories).forEach(category => {
                        const categoryCommands = categories[category].filter(cmd => commands[cmd]);
                        if (categoryCommands.length > 0) {
                            helpText += `${category}:\n`;
                            categoryCommands.forEach(cmdName => {
                                const cmd = commands[cmdName];
                                helpText += `• ${prefix}${cmdName}\n`;
                            });
                            helpText += '\n';
                        }
                    });

                    helpText += `💡 Use ${prefix}help <command> for detailed help\n`;
                    helpText += `> GURA-MD vBETA by Ryou`;

                    // send menu
                    const fileBuffer = fs.readFileSync("assets/violeto.mp4");
                    const buffer = fs.readFileSync("assets/bot_image.jpg");
                    await bot.sendVideo(chatId, fileBuffer, helpText, true);
                    // await bot.sendImage(chatId, buffer, helpText);
                } catch (error) {
                    // Fallback help if there's an error loading commands
                    const fallbackHelp = `💎 *WhatsApp Bot*\n\n` +
                        `Basic Commands:\n` +
                        `• ${prefix}ping - Check bot status\n` +
                        `• ${prefix}help - Show commands\n\n` +
                        `Use ${prefix}help <command> for more details.`;
                    
                    await bot.sendMessage(chatId, fallbackHelp);
                }
            }
        }
    },
    
    locked: {
        description: 'List of admin-only set of commands',
        usage: 'locked',
        aliases: ['sudomenu', 'adminmenu'],
        adminOnly: true,
        execute: async (context) => {
            const { chatId, bot } = context;
            const adminMenu = `*Commands Menu* \n📊 *Admin* \nsudoadd \nsudodel \nsettings \nset
                             \n👑 *Owner* \nmode \nantidelete \nsetpp`
            
            await bot.sendMessage(chatId, adminMenu);
        }
    },

    ping: {
        description: 'Check Bot Status',
        usage: 'ping',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, bot } = context;
            const startTime = Date.now();
            const currentMode = config.get('settings').mode;
            const seconds = Math.floor(process.uptime());
            const d = Math.floor(seconds / (3600*24));
            const h = Math.floor((seconds % (3600*24)) / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);

            const uptimeStr = 
                (d > 0 ? `${d}d ` : '') + 
                (h > 0 ? `${h}h ` : '') + 
                (m > 0 ? `${m}m ` : '') + 
                `${s}s`;
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            await bot.sendMessage(chatId, `⏱️ Response time: ${responseTime}ms\n` +
                                    `🔹 Mode: *${currentMode}*\n` +
                                    `⌚ Uptime: *${uptimeStr}*`);
        }
    }
};

module.exports = helpCommand;
