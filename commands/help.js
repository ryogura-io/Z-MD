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
                    let helpText = `🤖 *${config.get('ownerName')} WhatsApp Bot Commands (${Object.keys(commands).length} total)*\n\n`;
                    
                    // Categorize commands
                    const categories = {
                        '🏓 Basic': ['help', 'ping'],
                        '🛠️ Utility': ['tts', 'owner', 'joke', 'fact', 'quote', 'weather', 'define', 'lyrics', 'movie', 'anime', 'tourl'],
                        '🎨 Media': ['sticker', 'toimg', 'vv'],
                        '🎮 Games': ['hangman', 'trivia', 'truth', 'dare', 'word', 'a'],
                        '⬇️ Downloads': ['play/song', 'instagram', 'tiktok', 'youtube', 'ytmp3', 'spotify', 'image'],
                        '👥 Group': ['promote', 'demote', 'kick', 'add', 'setname', 'setdesc', 'close', 'open', 'tag', 'tagall', 'admins', 'resetlink', 'groupinfo', 'link'],
                        '🔧 Admin': ['sudoadd', 'sudodel', 'settings', 'set'],
                        '👑 Owner': ['mode', 'antidelete', 'setpp']
                    };
                    
                    Object.keys(categories).forEach(category => {
                        const categoryCommands = categories[category].filter(cmd => commands[cmd]);
                        if (categoryCommands.length > 0) {
                            helpText += `${category}:\n`;
                            categoryCommands.forEach(cmdName => {
                                const cmd = commands[cmdName];
                                const adminTag = cmd.adminOnly ? ' 👤' : '';
                                helpText += `• ${prefix}${cmdName}${adminTag}\n`;
                            });
                            helpText += '\n';
                        }
                    });

                    helpText += `💡 Use ${prefix}help <command> for detailed help\n`;
                    helpText += `👤 = Admin only commands\n`;

                    // send menu
                    const buffer = fs.readFileSync("assets/bot_image.jpg");
                    await bot.sendImage(chatId, buffer, helpText);
                } catch (error) {
                    // Fallback help if there's an error loading commands
                    const fallbackHelp = `🤖 *WhatsApp Bot*\n\n` +
                        `Basic Commands:\n` +
                        `• ${prefix}ping - Check bot status\n` +
                        `• ${prefix}help - Show commands\n\n` +
                        `Use ${prefix}help <command> for more details.`;
                    
                    await bot.sendMessage(chatId, fallbackHelp);
                }
            }
        }
    },
    
    ping: {
        description: 'Check if bot is responsive',
        usage: 'ping',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, bot } = context;
            const startTime = Date.now();
            
            await bot.sendMessage(chatId, '🏓 Pong!');
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            await bot.sendMessage(chatId, `⏱️ Response time: ${responseTime}ms`);
        }
    }
};

module.exports = helpCommand;
