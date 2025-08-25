const funCommands = {
    stupid: {
        description: 'Tag a random stupid person',
        usage: 'stupid',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, isGroup, bot, sock } = context;
            
            if (!isGroup) {
                await bot.sendMessage(chatId, '❌ This command can only be used in groups.');
                return;
            }
            
            try {
                const groupMetadata = await sock.groupMetadata(chatId);
                const participants = groupMetadata.participants.map(p => p.id);
                const randomUser = participants[Math.floor(Math.random() * participants.length)];
                
                await bot.sendMessage(chatId, `🤪 Today's most stupid person is @${randomUser.split('@')[0]}! 😂`);
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error getting group members.');
            }
        }
    },

    handsome: {
        description: 'Tag a random handsome person',
        usage: 'handsome',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, isGroup, bot, sock } = context;
            
            if (!isGroup) {
                await bot.sendMessage(chatId, '❌ This command can only be used in groups.');
                return;
            }
            
            try {
                const groupMetadata = await sock.groupMetadata(chatId);
                const participants = groupMetadata.participants.map(p => p.id);
                const randomUser = participants[Math.floor(Math.random() * participants.length)];
                
                await bot.sendMessage(chatId, `😍 Today's most handsome person is @${randomUser.split('@')[0]}! 💫`);
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error getting group members.');
            }
        }
    },

    wise: {
        description: 'Tag a random wise person',
        usage: 'wise',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, isGroup, bot, sock } = context;
            
            if (!isGroup) {
                await bot.sendMessage(chatId, '❌ This command can only be used in groups.');
                return;
            }
            
            try {
                const groupMetadata = await sock.groupMetadata(chatId);
                const participants = groupMetadata.participants.map(p => p.id);
                const randomUser = participants[Math.floor(Math.random() * participants.length)];
                
                await bot.sendMessage(chatId, `🧙‍♂️ Today's wisest person is @${randomUser.split('@')[0]}! 🌟`);
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error getting group members.');
            }
        }
    },

    rich: {
        description: 'Tag a random rich person',
        usage: 'rich',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, isGroup, bot, sock } = context;
            
            if (!isGroup) {
                await bot.sendMessage(chatId, '❌ This command can only be used in groups.');
                return;
            }
            
            try {
                const groupMetadata = await sock.groupMetadata(chatId);
                const participants = groupMetadata.participants.map(p => p.id);
                const randomUser = participants[Math.floor(Math.random() * participants.length)];
                
                await bot.sendMessage(chatId, `💰 Today's richest person is @${randomUser.split('@')[0]}! 💎`);
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error getting group members.');
            }
        }
    },

    poor: {
        description: 'Tag a random poor person',
        usage: 'poor',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, isGroup, bot, sock } = context;
            
            if (!isGroup) {
                await bot.sendMessage(chatId, '❌ This command can only be used in groups.');
                return;
            }
            
            try {
                const groupMetadata = await sock.groupMetadata(chatId);
                const participants = groupMetadata.participants.map(p => p.id);
                const randomUser = participants[Math.floor(Math.random() * participants.length)];
                
                await bot.sendMessage(chatId, `💸 Today's poorest person is @${randomUser.split('@')[0]}! 😅`);
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error getting group members.');
            }
        }
    }
};

module.exports = funCommands;