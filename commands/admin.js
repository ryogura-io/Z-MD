const config = require('../config');
const permissions = require('../utils/permissions');

const adminCommands = {
    addadmin: {
        description: 'Add a user as bot admin',
        usage: 'addadmin <phone_number>',
        aliases: ["aadmin", "sudoadd"],
        adminOnly: true,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            
            if (args.length === 0) {
                await bot.sendMessage(chatId, '❌ Please provide a phone number.\nUsage: !addadmin 1234567890');
                return;
            }
            
            const phoneNumber = args[0].replace(/[^\d]/g, '');
            if (phoneNumber.length < 10) {
                await bot.sendMessage(chatId, '❌ Please provide a valid phone number.');
                return;
            }
            
            const fullNumber = phoneNumber + '@s.whatsapp.net';
            
            if (config.addAdmin(fullNumber)) {
                await bot.sendMessage(chatId, `✅ Added ${phoneNumber} as bot admin.`);
            } else {
                await bot.sendMessage(chatId, `ℹ️ ${phoneNumber} is already a bot admin.`);
            }
        }
    },
    
    removeadmin: {
        description: 'Remove a user from bot admins',
        usage: 'removeadmin <phone_number>',
        aliases: ["radmin", "sudodel"],
        adminOnly: true,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            
            if (args.length === 0) {
                await bot.sendMessage(chatId, '❌ Please provide a phone number.\nUsage: !removeadmin 1234567890');
                return;
            }
            
            const phoneNumber = args[0].replace(/[^\d]/g, '');
            const fullNumber = phoneNumber + '@s.whatsapp.net';
            
            if (config.removeAdmin(fullNumber)) {
                await bot.sendMessage(chatId, `✅ Removed ${phoneNumber} from bot admins.`);
            } else {
                await bot.sendMessage(chatId, `❌ ${phoneNumber} is not a bot admin.`);
            }
        }
    },
    
    settings: {
        description: 'Show current bot settings',
        usage: 'settings',
        aliases: ["setting"],
        adminOnly: true,
        execute: async (context) => {
            const { chatId, bot } = context;
            const settings = config.get('settings');
            const admins = config.get('admins');
            
            const settingsText = `⚙️ *Bot Settings*\n\n` +
                `*Prefix:* ${config.get('prefix')}\n` +
                `*Auto Welcome:* ${settings.autoWelcome ? 'Enabled' : 'Disabled'}\n` +
                `*Auto Farewell:* ${settings.autoFarewell ? 'Enabled' : 'Disabled'}\n` +
                `*Delete Commands:* ${settings.deleteCommands ? 'Enabled' : 'Disabled'}\n` +
                `*Restrict to Admins:* ${settings.restrictToAdmins ? 'Enabled' : 'Disabled'}\n` +
                `*Command Cooldown:* ${config.get('commandCooldown')}ms\n` +
                `*Media Download Limit:* ${Math.round(config.get('mediaDownloadLimit') / 1024 / 1024)}MB\n\n` +
                `*Bot Admins:* ${admins.length}\n` +
                admins.map(admin => `• ${admin.split('@')[0]}`).join('\n');
            
            await bot.sendMessage(chatId, settingsText);
        }
    },
    
    setsetting: {
        description: 'Change bot settings',
        usage: 'setsetting <key> <value>',
        aliases: ["set"],
        adminOnly: true,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            
            if (args.length < 2) {
                await bot.sendMessage(chatId, '❌ Please provide setting key and value.\nUsage: !setsetting autoWelcome true');
                return;
            }
            
            const key = args[0].toLowerCase();
            const value = args[1].toLowerCase();
            
            const validSettings = ['autowelcome', 'autofarewell', 'deletecommands', 'restricttoadmins'];
            
            if (!validSettings.includes(key)) {
                await bot.sendMessage(chatId, `❌ Invalid setting key. Valid keys: ${validSettings.join(', ')}`);
                return;
            }
            
            const boolValue = value === 'true' || value === 'on' || value === 'yes' || value === '1';
            
            const settings = config.get('settings');
            const camelCaseKey = key.replace(/([a-z])([A-Z])/g, '$1$2').toLowerCase();
            
            // Map to actual setting names
            const settingMap = {
                'autowelcome': 'autoWelcome',
                'autofarewell': 'autoFarewell',
                'deletecommands': 'deleteCommands',
                'restricttoadmins': 'restrictToAdmins'
            };
            
            const actualKey = settingMap[camelCaseKey];
            if (actualKey) {
                settings[actualKey] = boolValue;
                config.updateSettings(settings);
                await bot.sendMessage(chatId, `✅ Setting ${actualKey} updated to: ${boolValue}`);
            }
        }
    }
};

module.exports = adminCommands;
