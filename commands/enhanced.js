const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const he = require("he"); 
const image2url = require("image2url");

const enhancedCommands = {
    tourl: {
        description: 'Upload image to get URL',
        usage: 'tourl (reply to image)',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, bot, message } = context;

            let targetMessage = null;

            // Check if replying to an image
            const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (quotedMessage?.imageMessage) {
                targetMessage = {
                    key: message.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMessage
                };
            }
            // Or if current message is an image
            else if (message.message?.imageMessage) {
                targetMessage = message;
            }

            if (!targetMessage) {
                await bot.sendMessage(chatId, { text: '❌ Please reply to an image or send an image with the command.' });
                return;
            }

            try {
                await bot.sendMessage(chatId, { text: '⏳ Uploading image...' });

                // Download image as buffer
                const buffer = await downloadMediaMessage(targetMessage, 'buffer', {});
                if (!buffer) {
                    await bot.sendMessage(chatId, { text: '❌ Failed to download image.' });
                    return;
                }

                // Save buffer to temp file
                const tempDir = path.join(__dirname, "..", "temp");
                if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

                const tempFile = path.join(tempDir, `upload_${Date.now()}.jpg`);
                fs.writeFileSync(tempFile, buffer);

                // Upload with image2url
                const imgbbKey = process.env.IMG_BB_KEY; // API key
                const uploadedUrl = await image2url.imgbb_upload(tempFile, imgbbKey);

                await bot.sendMessage(chatId, {
                    text: `✅ *Image uploaded successfully!*\n\n📎 URL: ${uploadedUrl}`
                });

                // Cleanup temp file
                fs.unlinkSync(tempFile);

            } catch (error) {
                console.error("❌ Upload error:", error);
                await bot.sendMessage(chatId, { text: '❌ Error uploading image to server.' });
            }
        }
    },



    movie: {
        description: 'Get movie information',
        usage: 'movie <movie name>',
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            
            if (args.length === 0) {
                await bot.sendMessage(chatId, '❌ Please provide a movie name.\nUsage: !movie Avengers');
                return;
            }
            
            try {
                const movieName = args.join(' ');
                const response = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=4428164a`);
                const movie = response.data;
                
                if (movie.Response === 'False') {
                    await bot.sendMessage(chatId, '❌ Movie not found. Please check the spelling and try again.');
                    return;
                }
                
                const movieText = `🎬 *${movie.Title}* (${movie.Year})\n\n` +
                    `⭐ Rating: ${movie.imdbRating}/10\n` +
                    `🎭 Genre: ${movie.Genre}\n` +
                    `🎬 Director: ${movie.Director}\n` +
                    `🎭 Cast: ${movie.Actors}\n` +
                    `⏱️ Runtime: ${movie.Runtime}\n` +
                    `🏆 Awards: ${movie.Awards}\n\n` +
                    `📝 *Plot:*\n${movie.Plot}`;
                
                await bot.sendMessage(chatId, movieText);
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error fetching movie information. Try again later!');
            }
        }
    },

    anime: {
        description: 'Get anime information',
        usage: 'anime <anime name>',
        aliases: ["ani"],
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;

            if (!args.length) {
                await bot.sendMessage(chatId, { text: '❌ Please provide an anime name.\nUsage: !anime Naruto' });
                return;
            }

            try {
                const animeName = args.join(' ');

                const query = `
                    query ($search: String) {
                        Media (search: $search, type: ANIME) {
                            title { romaji english }
                            description
                            episodes
                            status
                            averageScore
                            genres
                            format
                            startDate { year }
                            endDate { year }
                            coverImage { large medium }
                            siteUrl
                        }
                    }
                `;

                const response = await axios.post('https://graphql.anilist.co', {
                    query: query,
                    variables: { search: animeName }
                });

                const anime = response.data.data.Media;

                if (!anime) {
                    await bot.sendMessage(chatId, { text: '❌ Anime not found. Check spelling and try again.' });
                    return;
                }

                const title = anime.title.english || anime.title.romaji;
                const description = anime.description ? anime.description.replace(/<[^>]*>/g, '') : 'No description available';
                const truncatedDesc = description.length > 300 ? description.substring(0, 300) + '...' : description;
                const imageUrl = anime.coverImage?.large || anime.coverImage?.medium || null;

                let animeText =
                    `🎌 *${title}*\n\n` +
                    `⭐ Score: ${anime.averageScore ? anime.averageScore + '/100' : 'N/A'}\n` +
                    `📺 Episodes: ${anime.episodes || 'Unknown'}\n` +
                    `📅 Year: ${anime.startDate?.year || 'Unknown'}\n` +
                    `📺 Format: ${anime.format || 'Unknown'}\n` +
                    `📊 Status: ${anime.status || 'Unknown'}\n` +
                    `🏷️ Genres: ${anime.genres ? anime.genres.join(', ') : 'Unknown'}\n\n` +
                    `📝 *Description:*\n${truncatedDesc}\n\n` +
                    `🔗 [AniList Link](${anime.siteUrl})`;

                if (animeText.length > 1000) {
                    animeText = animeText.substring(0, 950) + '...';
                }

                if (imageUrl) {
                    const imageBuffer = (await axios.get(imageUrl, { responseType: 'arraybuffer' })).data;
                    await bot.sendMessage(chatId, { image: imageBuffer, caption: animeText });
                } else {
                    await bot.sendMessage(chatId, { text: animeText });
                }

            } catch (err) {
                console.error('❌ Anime command error:', err);
                await bot.sendMessage(chatId, { text: '❌ Error fetching anime information. Try again later!' });
            }
        }
    },



    toimg: {
        description: 'Convert sticker to image',
        usage: 'toimg (reply to sticker)',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, bot, message } = context;
            
            const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMessage?.stickerMessage) {
                await bot.sendMessage(chatId, '❌ Please reply to a sticker.');
                return;
            }
            
            try {
                await bot.sendMessage(chatId, '⏳ Converting sticker to image...');
                
                const fakeMessage = {
                    key: message.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMessage
                };
                
                const buffer = await downloadMediaMessage(fakeMessage, 'buffer', {});
                
                if (!buffer) {
                    await bot.sendMessage(chatId, '❌ Failed to download sticker.');
                    return;
                }
                
                // Convert WebP to PNG
                const imageBuffer = await sharp(buffer)
                    .png()
                    .toBuffer();
                
                await bot.sendImage(chatId, imageBuffer, '🖼️ Sticker converted to image');
                
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error converting sticker to image.');
            }
        }
    },

    url: {  // Alias for tourl, or replace tourl with this
        description: 'Upload image to get URL',
        usage: 'url (reply to image)',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, bot, message } = context;
            
            let targetMessage = null;
            const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (quotedMessage?.imageMessage) {
                targetMessage = {
                    key: message.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMessage
                };
            } else if (message.message?.imageMessage) {
                targetMessage = message;
            }
            
            if (!targetMessage) {
                await bot.sendMessage(chatId, '❌ Reply to/send an image.');
                return;
            }
            
            try {
                await bot.sendMessage(chatId, '⏳ Uploading...');
                const buffer = await downloadMediaMessage(targetMessage, 'buffer', {});
                if (!buffer) return bot.sendMessage(chatId, '❌ Download failed.');
                
                // Primary: imgbb
                let imageUrl;
                try {
                    const result = await imgbbUploader({
                        apiKey: 'c7427b69f5258372a34457ff92d7e642',
                        base64string: buffer.toString('base64')
                    });
                    imageUrl = result.display_url;
                } catch (err) {
                    // Fallback: telegra.ph via axios (no extra npm needed)
                    const formData = new FormData();
                    formData.append('file', buffer, 'image.jpg');
                    const res = await axios.post('https://telegra.ph/upload', formData, {
                        headers: formData.getHeaders()
                    });
                    if (res.data && res.data[0] && res.data[0].src) {
                        imageUrl = `https://telegra.ph${res.data[0].src}`;
                    } else {
                        throw new Error('Fallback failed');
                    }
                }
                
                await bot.sendMessage(chatId, `🔗 URL: ${imageUrl}`);
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Upload failed.');
            }
        }
    },

    lyrics: {
        description: 'Get song lyrics',
        usage: 'lyrics <artist> <song>',
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            if (args.length < 2) return bot.sendMessage(chatId, '❌ Provide artist and song.');
            const artist = args[0];
            const title = args.slice(1).join(' ');
            try {
                const lyrics = await lyricsFinder(artist, title);
                if (!lyrics) return bot.sendMessage(chatId, '❌ Not found.');
                await bot.sendMessage(chatId, `🎵 ${artist} - ${title}\n\n${lyrics}`);
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Fetch failed.');
            }
        }
    },

    series: {
        description: 'Get TV series info',
        usage: 'series <name>',
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            if (!args.length) return bot.sendMessage(chatId, '❌ Provide name.');
            const name = args.join(' ');
            try {
                const res = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(name)}&type=series&apikey=4428164a`);
                const data = res.data;
                if (data.Response === 'False') return bot.sendMessage(chatId, '❌ Not found.');
                const text = `📺 ${data.Title} (${data.Year})\n⭐ ${data.imdbRating}/10\n🎭 ${data.Genre}\n📝 ${data.Plot}\n⏱️ ${data.totalSeasons} seasons`;
                await bot.sendMessage(chatId, text);
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Fetch failed.');
            }
        }
    },

    sanime: {
        description: 'Search anime details',
        usage: 'sanime <name>',
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            if (!args.length) return bot.sendMessage(chatId, '❌ Provide name.');
            const name = args.join(' ');
            try {
                const anime = await anilist.search.anime(name, 1, 1);
                if (!anime.media.length) return bot.sendMessage(chatId, '❌ Not found.');
                const id = anime.media[0].id;
                const info = await anilist.media.anime(id);
                const text = `🎌 ${info.title.english || info.title.romaji}\n⭐ ${info.averageScore}/100\n📺 ${info.episodes} eps\n📅 ${info.startDate.year}\n📝 ${info.description.slice(0, 300)}...`;
                await bot.sendMessage(chatId, text);
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Fetch failed.');
            }
        }
    },

    img: {
        description: 'Search images',
        usage: 'img <query>',
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

module.exports = enhancedCommands;