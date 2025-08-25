const downloaderCommands = {
    play: {
        description: 'Search and download music',
        usage: 'play <song name>',
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            
            if (args.length === 0) {
                await bot.sendMessage(chatId, '❌ Please provide a song name.\nUsage: !play Bohemian Rhapsody');
                return;
            }
            
            try {
                await bot.sendMessage(chatId, '🔍 Searching for song...');
                
                const song = args.join(' ');
                
                // Mock search result for demo
                const mockInfo = `🎵 *${song}*\n\n` +
                    `👨‍🎤 Artist: Various Artists\n` +
                    `💿 Album: Demo Album\n` +
                    `⏱️ Duration: 3:45\n\n` +
                    `ℹ️ *Music download feature*\n\nNote: Music downloading requires API configuration and proper licensing.\nThis is a demo response.`;
                
                await bot.sendMessage(chatId, mockInfo);
                
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error searching for song. Try again later!');
            }
        }
    },

    song: {
        description: 'Download song by name',
        usage: 'song <song name>',
        adminOnly: false,
        execute: async (context) => {
            // Alias for play command
            return downloaderCommands.play.execute(context);
        }
    },

    instagram: {
        description: 'Download Instagram media',
        usage: 'instagram <Instagram URL>',
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            
            if (args.length === 0) {
                await bot.sendMessage(chatId, '❌ Please provide an Instagram URL.\nUsage: !instagram <URL>');
                return;
            }
            
            try {
                await bot.sendMessage(chatId, '⏳ Processing Instagram URL...');
                
                const url = args[0];
                
                // Validate URL format
                if (!url.includes('instagram.com')) {
                    await bot.sendMessage(chatId, '❌ Please provide a valid Instagram URL.');
                    return;
                }
                
                const demoResponse = `ℹ️ *Instagram Download Feature*\n\n` +
                    `📎 URL: ${url}\n\n` +
                    `Note: Instagram media downloading requires API configuration.\n` +
                    `This feature is available but needs proper setup for full functionality.`;
                
                await bot.sendMessage(chatId, demoResponse);
                
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error processing Instagram URL. Make sure the URL is valid.');
            }
        }
    },

    ig: {
        description: 'Download Instagram media (short)',
        usage: 'ig <Instagram URL>',
        adminOnly: false,
        execute: async (context) => {
            return downloaderCommands.instagram.execute(context);
        }
    },

    tiktok: {
        description: 'Download TikTok video',
        usage: 'tiktok <TikTok URL>',
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            
            if (args.length === 0) {
                await bot.sendMessage(chatId, '❌ Please provide a TikTok URL.\nUsage: !tiktok <URL>');
                return;
            }
            
            try {
                await bot.sendMessage(chatId, '⏳ Processing TikTok URL...');
                
                const url = args[0];
                
                // Validate URL format
                if (!url.includes('tiktok.com')) {
                    await bot.sendMessage(chatId, '❌ Please provide a valid TikTok URL.');
                    return;
                }
                
                const demoResponse = `ℹ️ *TikTok Download Feature*\n\n` +
                    `📎 URL: ${url}\n\n` +
                    `Note: TikTok video downloading requires API configuration.\n` +
                    `This feature is available but needs proper setup for full functionality.`;
                
                await bot.sendMessage(chatId, demoResponse);
                
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error processing TikTok URL. Make sure the URL is valid.');
            }
        }
    },

    tt: {
        description: 'Download TikTok video (short)',
        usage: 'tt <TikTok URL>',
        adminOnly: false,
        execute: async (context) => {
            return downloaderCommands.tiktok.execute(context);
        }
    },

    youtube: {
        description: 'Download YouTube video',
        usage: 'youtube <YouTube URL>',
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            
            if (args.length === 0) {
                await bot.sendMessage(chatId, '❌ Please provide a YouTube URL.\nUsage: !youtube <URL>');
                return;
            }
            
            try {
                await bot.sendMessage(chatId, '⏳ Processing YouTube URL...');
                
                const url = args[0];
                
                // Validate URL format
                if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
                    await bot.sendMessage(chatId, '❌ Please provide a valid YouTube URL.');
                    return;
                }
                
                const demoResponse = `ℹ️ *YouTube Download Feature*\n\n` +
                    `📎 URL: ${url}\n\n` +
                    `Note: YouTube video downloading requires API configuration.\n` +
                    `This feature is available but needs proper setup for full functionality.`;
                
                await bot.sendMessage(chatId, demoResponse);
                
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error processing YouTube URL. Make sure the URL is valid.');
            }
        }
    },

    ytmp3: {
        description: 'Download YouTube audio',
        usage: 'ytmp3 <YouTube URL>',
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            
            if (args.length === 0) {
                await bot.sendMessage(chatId, '❌ Please provide a YouTube URL.\nUsage: !ytmp3 <URL>');
                return;
            }
            
            try {
                await bot.sendMessage(chatId, '⏳ Processing YouTube URL...');
                
                const url = args[0];
                
                // Validate URL format
                if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
                    await bot.sendMessage(chatId, '❌ Please provide a valid YouTube URL.');
                    return;
                }
                
                const demoResponse = `ℹ️ *YouTube Audio Download Feature*\n\n` +
                    `📎 URL: ${url}\n\n` +
                    `Note: YouTube audio downloading requires API configuration.\n` +
                    `This feature is available but needs proper setup for full functionality.`;
                
                await bot.sendMessage(chatId, demoResponse);
                
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error processing YouTube URL. Make sure the URL is valid.');
            }
        }
    }
};

module.exports = downloaderCommands;