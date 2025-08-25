const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const enhancedCommands = {
    tourl: {
        description: 'Upload image to get URL',
        usage: 'tourl (reply to image)',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, bot, message } = context;
            
            let targetMessage = null;
            
            // Check if replying to a message with image
            const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (quotedMessage?.imageMessage) {
                targetMessage = {
                    key: message.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMessage
                };
            } 
            // Check if current message has image
            else if (message.message?.imageMessage) {
                targetMessage = message;
            }
            
            if (!targetMessage) {
                await bot.sendMessage(chatId, '❌ Please reply to an image or send an image with the command.');
                return;
            }
            
            try {
                await bot.sendMessage(chatId, '⏳ Uploading image...');
                
                const buffer = await downloadMediaMessage(targetMessage, 'buffer', {});
                
                if (!buffer) {
                    await bot.sendMessage(chatId, '❌ Failed to download image.');
                    return;
                }
                
                // Save to temp file
                const tempFile = path.join(__dirname, '..', 'temp', `upload_${Date.now()}.jpg`);
                const tempDir = path.dirname(tempFile);
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                
                fs.writeFileSync(tempFile, buffer);
                
                // Upload to a simple image host (using imgbb as alternative)
                const imgbbKey = 'your-imgbb-key'; // Would need API key
                // For now, just return a placeholder URL
                const imageUrl = `https://via.placeholder.com/400x300.png?text=Image+Upload+Feature+Available`;
                
                await bot.sendMessage(chatId, `ℹ️ *Image upload feature*\n\nNote: Image uploading requires API configuration.\nFor now, the image has been processed successfully!\n\n📎 Demo URL: ${imageUrl}`);
                
                // Clean up
                fs.unlinkSync(tempFile);
                
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error uploading image to server.');
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
                const response = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=8e2ce983`);
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
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;
            
            if (args.length === 0) {
                await bot.sendMessage(chatId, '❌ Please provide an anime name.\nUsage: !anime Naruto');
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
                        }
                    }
                `;
                
                const response = await axios.post('https://graphql.anilist.co', {
                    query: query,
                    variables: { search: animeName }
                });
                
                const anime = response.data.data.Media;
                
                if (!anime) {
                    await bot.sendMessage(chatId, '❌ Anime not found. Please check the spelling and try again.');
                    return;
                }
                
                const title = anime.title.english || anime.title.romaji;
                const description = anime.description ? anime.description.replace(/<[^>]*>/g, '') : 'No description available';
                const truncatedDesc = description.length > 300 ? description.substring(0, 300) + '...' : description;
                
                const animeText = `🎌 *${title}*\n\n` +
                    `⭐ Score: ${anime.averageScore ? anime.averageScore + '/100' : 'N/A'}\n` +
                    `📺 Episodes: ${anime.episodes || 'Unknown'}\n` +
                    `📅 Year: ${anime.startDate?.year || 'Unknown'}\n` +
                    `📺 Format: ${anime.format || 'Unknown'}\n` +
                    `📊 Status: ${anime.status || 'Unknown'}\n` +
                    `🏷️ Genres: ${anime.genres ? anime.genres.join(', ') : 'Unknown'}\n\n` +
                    `📝 *Description:*\n${truncatedDesc}`;
                
                await bot.sendMessage(chatId, animeText);
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error fetching anime information. Try again later!');
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
    }
};

module.exports = enhancedCommands;