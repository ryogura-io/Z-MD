const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');



const streamToBuffer = (stream) => new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
});

const downloaderCommands = {
    play: {
        description: 'Search and download music',
        usage: 'play <song name>',
        aliases: ["song", "music", "mp3"],
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            if (args.length === 0) return bot.sendMessage(chatId, '❌ Provide song name.');
            const song = args.join(' ');
            try {
                await bot.sendMessage(chatId, '🔍 Searching...');
                const search = await ytSearch(song);
                const video = search.videos[0];
                if (!video) return bot.sendMessage(chatId, '❌ No results.');
                const url = video.url;
                await bot.sendMessage(chatId, `🎵 Found: ${video.title} (${video.duration.timestamp})`);
                const stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });
                const buffer = await streamToBuffer(stream);
                if (buffer.length > config.get('mediaDownloadLimit')) return bot.sendMessage(chatId, '❌ File too large.');
                await bot.sendAudio(chatId, buffer);
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error downloading audio.');
            }
        }
    },


    instagram: {
        description: 'Download Instagram media',
        usage: 'instagram <Instagram URL>',
        aliases: ["ig"],
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            if (args.length === 0) return bot.sendMessage(chatId, '❌ Provide URL.');
            const url = args[0];
            try {
                await bot.sendMessage(chatId, '⏳ Downloading...');
                const downloadLinks = await igdl(url);
                const mediaUrl = downloadLinks[0];  // First media item
                const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(response.data);
                if (buffer.length > config.get('mediaDownloadLimit')) return bot.sendMessage(chatId, '❌ File too large.');
                if (mediaUrl.endsWith('.mp4')) {
                    await bot.sendVideo(chatId, buffer);
                } else {
                    await bot.sendImage(chatId, buffer);
                }
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error downloading Instagram media.');
            }
        }
    },


    //  tiktok: {
    //     description: 'Download TikTok videos without watermark',
    //     usage: 'tiktok <TikTok URL>',
    //     aliases: ['tt', 'ttd'],
    //     adminOnly: false,
    //     execute: async (context) => {
    //         const { args, chatId, bot } = context;

    //         if (args.length === 0) {
    //             await bot.sendMessage(chatId, '❌ Please provide a TikTok URL.\nUsage: !tiktok https://www.tiktok.com/@user/video/1234567890');
    //             return;
    //         }

    //         const url = args[0];

    //         try {
    //             const videoData = await TiklyClient.video(url);

    //             if (!videoData || !videoData.videoNoWaterMark) {
    //                 await bot.sendMessage(chatId, '❌ Failed to fetch video. Make sure the URL is correct.');
    //                 return;
    //             }

    //             const videoBuffer = Buffer.from(await (await fetch(videoData.videoNoWaterMark)).arrayBuffer());

    //             await bot.sendMessage(chatId, {
    //                 video: videoBuffer,
    //                 caption: `🎬 TikTok Download\n\n👤 Author: ${videoData.authorName || 'Unknown'}\n🎵 Music: ${videoData.music || 'Original'}\n🔗 URL: ${url}`
    //             });

    //         } catch (error) {
    //             console.error('Error downloading TikTok video:', error);
    //             await bot.sendMessage(chatId, '❌ Error downloading TikTok video. Try again later!');
    //         }
    //     }
    // },


    youtube: {
        description: 'Download YouTube video',
        usage: 'youtube <YouTube URL>',
        aliases: ["yt", "video"],
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            if (args.length === 0) return bot.sendMessage(chatId, '❌ Provide URL.');
            const url = args[0];
            try {
                await bot.sendMessage(chatId, '⏳ Downloading...');
                const info = await ytdl.getInfo(url);
                const stream = ytdl.downloadFromInfo(info, { quality: 'highestvideo' });
                const buffer = await streamToBuffer(stream);
                if (buffer.length > config.get('mediaDownloadLimit')) return bot.sendMessage(chatId, '❌ File too large.');
                await bot.sendVideo(chatId, buffer, `🎥 ${info.videoDetails.title}`);
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error downloading video.');
            }
        }
    },

    ytmp3: {
        description: 'Download YouTube audio',
        usage: 'ytmp3 <YouTube URL>',
        aliases: [""],
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            if (args.length === 0) return bot.sendMessage(chatId, '❌ Provide URL.');
            const url = args[0];
            try {
                await bot.sendMessage(chatId, '⏳ Downloading...');
                const info = await ytdl.getInfo(url);
                const stream = ytdl.downloadFromInfo(info, { filter: 'audioonly', quality: 'highestaudio' });
                const buffer = await streamToBuffer(stream);
                if (buffer.length > config.get('mediaDownloadLimit')) return bot.sendMessage(chatId, '❌ File too large.');
                await bot.sendAudio(chatId, buffer);
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error downloading audio.');
            }
        }
    },

    spotify: {
        description: 'Download Spotify track',
        usage: 'spotify <URL>',
        aliases: ["spot"],
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            if (!args.length) return bot.sendMessage(chatId, '❌ Provide URL.');
            const url = args[0];
            try {
                await bot.sendMessage(chatId, '⏳ Downloading...');
                const data = await spotify.default(url);
                const buffer = await spotify.downloadTrack(url);
                if (buffer.length > config.get('mediaDownloadLimit')) return bot.sendMessage(chatId, '❌ Too large.');
                await bot.sendAudio(chatId, buffer);
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Download failed.');
            }
        }
    },

    img: {
        description: 'Search images',
        usage: 'img <query>',
        aliases: ["picture", "image"],
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            if (!args.length) return bot.sendMessage(chatId, '❌ Provide query.');
            const query = args.join(' ');
            try {
                const images = await googlethis.image(query, { safe: true });
                if (!images.length) return bot.sendMessage(chatId, '❌ No results.');
                const top3 = images.slice(0, 3).map(i => i.url).join('\n');
                await bot.sendMessage(chatId, `🖼️ Top images for "${query}":\n${top3}`);
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Search failed.');
            }
        }
    }
};

module.exports = downloaderCommands;