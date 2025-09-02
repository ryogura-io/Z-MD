const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const axios = require("axios");
const { igdl } = require('ruhend-scraper');
const yts = require('yt-search');



const streamToBuffer = (stream) => new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
});

const downloaderCommands = {
    play: {
        description: "Play or download a YouTube song as MP3",
        usage: "play <song name>",
        aliases: ["song", "music", "ytmp3"],
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;

            const searchQuery = args.join(" ").trim();
            if (!searchQuery) {
                return await bot.sendMessage(chatId, "🎶 What song do you want to download?");
            }

            try {
                // 🔎 Search on YouTube
                const { videos } = await yts(searchQuery);
                if (!videos || videos.length === 0) {
                    return await bot.sendMessage(chatId, "❌ No songs found!");
                }

                // ⏳ Notify user
                await bot.sendMessage(chatId, "_Please wait, your download is in progress..._");

                // 🎥 First video result
                const video = videos[0];
                const urlYt = video.url;

                // 🎧 Fetch MP3 download link
                const response = await axios.get(`https://apis-keith.vercel.app/download/dlmp3?url=${urlYt}`);
                const data = response.data;

                if (!data || !data.status || !data.result || !data.result.downloadUrl) {
                    return await bot.sendMessage(chatId, "⚠️ Failed to fetch audio. Please try again later.");
                }

                const audioUrl = data.result.downloadUrl;
                const title = data.result.title;

                // 🎵 Send MP3 audio
                await bot.sendAudio(
                    chatId,
                    { url: audioUrl },
                    {
                        mimetype: "audio/mpeg",
                        fileName: `${title}.mp3`
                    }
                );

            } catch (error) {
                console.error("❌ Error in play command:", error);
                await bot.sendMessage(chatId, "⚠️ Download failed. Please try again later.");
            }
        }
    },


    instagram: {
        description: 'Download Instagram media from a link',
        usage: 'ig <url>',
        aliases: ["ig"],
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            const url = args[0];

            if (!url) {
                return bot.sendMessage(chatId, '❌ Please provide a valid Instagram link.');
            }

            try {
                let mediaUrls = [];
                let caption = '';

                // --- Primary: Ruhend scraper ---
                try {
                    const res = await igdl(url);
                    const data = await res.data;

                    if (Array.isArray(data) && data.length > 0) {
                        mediaUrls = data.map(media => media.url).filter(u => typeof u === 'string');
                    } else {
                        throw new Error('No media returned by igdl');
                    }
                } catch (err) {
                    console.error('ruhend-scraper failed, using fallback:', err.message);

                    // --- Fallback: Dreaded API ---
                    const res2 = await fetch(`https://api.dreaded.site/api/igdl?url=${encodeURIComponent(url)}`);
                    const data2 = await res2.json();

                    if (data2.success && Array.isArray(data2.result?.url) && data2.result.url.length) {
                        mediaUrls = data2.result.url;
                        caption = data2.result.metadata?.caption || '';
                    } else {
                        throw new Error('Fallback API did not return media');
                    }
                }

                // --- Send each media item ---
                for (const mediaUrl of mediaUrls) {
                    const mediaRes = await fetch(mediaUrl);
                    const buffer = Buffer.from(await mediaRes.arrayBuffer());

                    if (/\.mp4($|\?)/.test(mediaUrl)) {
                        await bot.sendVideo(chatId, buffer, caption);
                    } else {
                        await bot.sendImage(chatId, buffer, caption);
                    }
                }
            } catch (error) {
                console.error('Instagram command error:', error);
                await bot.sendMessage(chatId, '⚠️ Could not fetch Instagram media. Please try again later.');
            }
        }
    },

    tiktok: {
        description: 'Download TikTok videos from a link',
        usage: 'tiktok <url>',
        aliases: ["tt"],
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            const url = args[0];

            if (!url) {
                return bot.sendMessage(chatId, '❌ Please provide a TikTok link.');
            }

            try {
                let videoUrl, captionText, dreadedData;

                // --- Primary: Dreaded API ---
                const dreadedRes = await fetch(`https://api.dreaded.site/api/tiktok?url=${encodeURIComponent(url)}`);
                dreadedData = await dreadedRes.json();

                if (dreadedData?.success && dreadedData?.tiktok?.video) {
                    videoUrl = dreadedData.tiktok.video;
                    captionText = `🎶 TikTok Video\n\n📝 ${dreadedData.tiktok.description || ""}\n👤 ${dreadedData.tiktok.author?.nickname || "Unknown"}`;
                }

                // --- Fallback: GiftedTech API ---
                if (!videoUrl) {
                    const giftedRes = await fetch(`https://api.giftedtech.web.id/api/download/tiktokdlv4?apikey=gifted&url=${encodeURIComponent(url)}`);
                    const giftedData = await giftedRes.json();

                    if (giftedData?.success && giftedData?.result) {
                        videoUrl = giftedData.result.video_no_watermark || giftedData.result.videoUrl || giftedData.result.video;
                        captionText = `🎶 TikTok Video\n\n📝 ${giftedData.result.desc || ""}`;
                    }
                }

                if (!videoUrl) {
                    return bot.sendMessage(chatId, "❌ Could not fetch TikTok video.");
                }

                // --- Download the video ---
                const videoRes = await fetch(videoUrl, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36",
                        "Referer": "https://www.tiktok.com/"
                    },
                    redirect: "follow"
                });

                if (!videoRes.ok) {
                    console.error("❌ Failed to fetch video:", videoRes.status, videoRes.statusText);
                    return bot.sendMessage(chatId, "⚠️ Video URL expired or blocked.");
                }

                const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
                if (videoBuffer.length === 0) {
                    return bot.sendMessage(chatId, "⚠️ Downloaded video is empty.");
                }

                // --- Send the video ---
                await bot.sendVideo(
                    chatId,
                    videoBuffer,
                    captionText || "🎶 TikTok Video \n> 𝙶𝚄𝚁𝙰-𝙼𝙳",
                    {
                        externalAdReply: {
                            title: "TikTok Downloader",
                            body: "Powered by 𝙶𝚄𝚁𝙰-𝙼𝙳",
                            thumbnailUrl: dreadedData?.tiktok?.author?.avatar || "",
                            sourceUrl: url,
                            mediaType: 2,
                            renderLargerThumbnail: true
                        }
                    }
                );

            } catch (err) {
                console.error("TikTok command error:", err);
                await bot.sendMessage(chatId, "❌ Error processing TikTok command.");
            }
        }
    },

    youtube: {
        description: "Download YouTube videos",
        usage: "youtube <video name or link>",
        aliases: ["video", "yt"],
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            const searchQuery = args.join(" ").trim();

            if (!searchQuery) {
                return await bot.sendMessage(chatId, "🎥 What video do you want to download?");
            }

            try {
                let videoUrl = "";
                let videoTitle = "";
                let videoThumbnail = "";

                // Determine if input is a YouTube link
                if (/^(https?:\/\/)/.test(searchQuery)) {
                    videoUrl = searchQuery;
                } else {
                    // Search YouTube for the video
                    const { videos } = await yts(searchQuery);
                    if (!videos || videos.length === 0) {
                        return await bot.sendMessage(chatId, "❌ No videos found!");
                    }
                    videoUrl = videos[0].url;
                    videoTitle = videos[0].title;
                    videoThumbnail = videos[0].thumbnail;
                }

                // Send thumbnail immediately
                try {
                    const ytId = (videoUrl.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/) || [])[1];
                    const thumb = videoThumbnail || (ytId ? `https://i.ytimg.com/vi/${ytId}/sddefault.jpg` : undefined);
                    if (thumb) {
                        await bot.sendImage(chatId, await (await axios.get(thumb, { responseType: "arraybuffer" })).data, `*${videoTitle || searchQuery}*\nDownloading...`);
                    }
                } catch (e) {
                    console.error("[YOUTUBE] thumb error:", e?.message || e);
                }

                // Validate YouTube URL
                if (!videoUrl.match(/(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/)) {
                    return await bot.sendMessage(chatId, "❌ This is not a valid YouTube link!");
                }

                // Fetch video metadata from PrinceTech API
                let videoDownloadUrl = "";
                let title = "";
                try {
                    const meta = await princeVideoApi.fetchMeta(videoUrl);
                    if (meta?.success && meta?.result?.download_url) {
                        videoDownloadUrl = meta.result.download_url;
                        title = meta.result.title || "video";
                    } else {
                        return await bot.sendMessage(chatId, "⚠️ Failed to fetch video from the API.");
                    }
                } catch (e) {
                    console.error("[YOUTUBE] prince API error:", e?.message || e);
                    return await bot.sendMessage(chatId, "⚠️ Failed to fetch video from the API.");
                }

                const filename = `${title}.mp4`;

                // Try sending the video directly from the remote URL
                try {
                    await bot.sendVideo(chatId, { url: videoDownloadUrl, fileName: filename, mimetype: "video/mp4", caption: `*${title}*\n> *𝙶𝚄𝚁𝙰-𝙼𝙳 ✨*` });
                    return;
                } catch (err) {
                    console.warn("[YOUTUBE] Direct send failed, attempting buffer...", err?.message || err);
                }

                // Fallback: download video into buffer
                let buffer;
                try {
                    const videoRes = await axios.get(videoDownloadUrl, {
                        headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://youtube.com/" },
                        responseType: "arraybuffer",
                    });
                    buffer = Buffer.from(videoRes.data);
                } catch (err) {
                    return await bot.sendMessage(chatId, "⚠️ Failed to download the video file.");
                }

                if (!buffer || buffer.length < 1024) {
                    return await bot.sendMessage(chatId, "⚠️ Downloaded file is empty or too small.");
                }

                // Send the video buffer
                await bot.sendVideo(chatId, { buffer, fileName: filename, mimetype: "video/mp4", caption: `*${title}*` });

            } catch (error) {
                console.error("[YOUTUBE] Command error:", error?.message || error);
                await bot.sendMessage(chatId, "❌ Download failed: " + (error?.message || "Unknown error"));
            }
        }
    },

    spotify: {
        description: "Download Spotify tracks",
        usage: "spotify <track link>",
        aliases: ["spot"],
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            const url = args[0];

            if (!url) {
                return await bot.sendMessage(
                    chatId,
                    "🎵 Please provide a Spotify track link!\nExample: `spotify https://open.spotify.com/track/2DGa7iaidT5s0qnINlwMjJ`"
                );
            }

            try {
                const res = await fetch(`https://api.giftedtech.web.id/api/download/spotifydl?apikey=gifted&url=${encodeURIComponent(url)}`);
                const data = await res.json();

                if (!data.success || !data.result?.download_url) {
                    throw new Error("Spotify API failed.");
                }

                const { title, duration, thumbnail, download_url } = data.result;

                // Send track info first
                await bot.sendImage(
                    chatId,
                    await (await fetch(thumbnail)).arrayBuffer(),
                    `🎶 *Spotify Downloader* 🎶\n\n🎵 *Title:* ${title}\n⏱️ *Duration:* ${duration}\n🔗 [Download Link](${download_url})`
                );

                // Then send the audio file
                await bot.sendAudio(
                    chatId,
                    { url: download_url, mimetype: "audio/mpeg", fileName: `${title}.mp3` }
                );

            } catch (err) {
                console.error("Spotify command error:", err.message);
                await bot.sendMessage(chatId, "❌ Could not fetch Spotify track. Please try again later.");
            }
        }
    },

    image: {
        description: "Search Google Images and send a random result",
        usage: "img <search query>",
        aliases: ["img", "picture", "pic"],
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            const query = args.join(" ");

            if (!query) {
                return await bot.sendMessage(
                    chatId,
                    "❌ Please provide a search query.\nExample: `img brown dog`"
                );
            }

            try {
                const { data } = await axios.get("https://api.giftedtech.web.id/api/search/googleimage", {
                    params: { apikey: "gifted", query: query },
                    headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
                });

                if (!data?.success || !data?.results || data.results.length === 0) {
                    return await bot.sendMessage(chatId, "⚠️ No images found.");
                }

                // Pick a random image
                const randomImage = data.results[Math.floor(Math.random() * data.results.length)];

                // Send image
                await bot.sendImage(
                    chatId,
                    await (await axios.get(randomImage, { responseType: "arraybuffer" })).data,
                    `🔍 Google Image Result for: *${query}*`
                );

            } catch (err) {
                console.error("Google Image command error:", err?.response?.data || err.message);
                await bot.sendMessage(chatId, "❌ Error fetching image search result.");
            }
        }
    },


    waifu: {
        description: 'Get a random waifu picture',
        usage: 'waifu',
        aliases: ["wife"],
        adminOnly: false,
        execute: async (context) => {
            const { chatId, bot } = context;

            try {
                // Try waifu.pics API first
                const response = await axios.get("https://api.waifu.pics/sfw/waifu");

                if (response.data && response.data.url) {
                    await bot.sendImage(chatId, await (await axios.get(response.data.url, { responseType: "arraybuffer" })).data, "> 𝙶𝚄𝚁𝙰-𝙼𝙳 \n> _waifu.pics_");
                    return;
                }

                // If waifu.pics failed, use giftedtech API as fallback
                throw new Error("Primary API failed");
            } catch (error) {
                console.warn("Waifu API failed, trying fallback...", error.message);

                try {
                    const fallback = await axios.get("https://api.giftedtech.web.id/api/anime/waifu?apikey=gifted");

                    if (fallback.data && fallback.data.result) {
                        await bot.sendImage(chatId, await (await axios.get(fallback.data.result, { responseType: "arraybuffer" })).data, "> 𝙶𝚄𝚁𝙰-𝙼𝙳");
                    } else {
                        await bot.sendMessage(chatId, "❌ Couldn't fetch waifu picture, try again later!");
                    }
                } catch (fallbackError) {
                    console.error("Fallback waifu API failed:", fallbackError.message);
                    await bot.sendMessage(chatId, "⚠️ Both waifu sources are down, please try again later.");
                }
            }
        }
    },

};

module.exports = downloaderCommands;