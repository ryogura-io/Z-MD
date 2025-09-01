const gtts = require('gtts');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');
const he = require("he");
const image2url = require("image2url");

const utilityCommands = {
    tts: {
        description: 'Convert text to speech',
        usage: 'tts <text>',
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;

            if (args.length === 0) {
                await bot.sendMessage(chatId, '❌ Please provide text to convert.\nUsage: !tts Hello World');
                return;
            }

            try {
                const text = args.join(' ');
                const tts = new gtts(text, 'en');
                const tempFile = path.join(__dirname, '..', 'temp', `tts_${Date.now()}.mp3`);

                // Create temp directory if it doesn't exist
                const tempDir = path.dirname(tempFile);
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                tts.save(tempFile, async (err) => {
                    if (err) {
                        await bot.sendMessage(chatId, '❌ Error generating speech');
                        return;
                    }

                    const audioBuffer = fs.readFileSync(tempFile);
                    await bot.sendAudio(chatId, audioBuffer);

                    // Clean up temp file
                    fs.unlinkSync(tempFile);
                });

            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error converting text to speech');
            }
        }
    },

    owner: {
        description: 'Send owner contact card',
        usage: 'owner',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, bot, sock } = context;

            try {
                const vcard = 'BEGIN:VCARD\n' +
                    'VERSION:3.0\n' +
                    'FN:Bot Owner\n' +
                    'ORG:WhatsApp Bot;\n' +
                    'TEL;type=CELL;type=VOICE;waid=2348153827918:+234 815 382 7918\n' +
                    'END:VCARD';

                await sock.sendMessage(chatId, {
                    contacts: {
                        displayName: 'Bot Owner',
                        contacts: [{
                            vcard: vcard
                        }]
                    }
                });
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error sending owner contact');
            }
        }
    },

    joke: {
        description: 'Get a random joke',
        usage: 'joke',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, bot } = context;

            try {
                const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
                const joke = response.data;

                const jokeText = `😂 *Random Joke*\n\n${joke.setup}\n\n${joke.punchline}`;
                await bot.sendMessage(chatId, jokeText);
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error fetching joke. Try again later!');
            }
        }
    },

    fact: {
        description: 'Get a random fact',
        usage: 'fact',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, bot } = context;

            try {
                const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
                const fact = response.data.text;

                const factText = `🧠 *Random Fact*\n\n${fact}`;
                await bot.sendMessage(chatId, factText);
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error fetching fact. Try again later!');
            }
        }
    },

    quote: {
        description: 'Get a random quote',
        usage: 'quote',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, bot } = context;

            try {
                const response = await axios.get('https://api.quotable.io/random');
                const quote = response.data;

                const quoteText = `💭 *Random Quote*\n\n"${quote.content}"\n\n_- ${quote.author}_`;
                await bot.sendMessage(chatId, quoteText);
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Error fetching quote. Try again later!');
            }
        }
    },

    weather: {
        description: 'Get weather information',
        usage: 'weather <location>',
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;

            if (args.length === 0) {
                await bot.sendMessage(chatId, '❌ Please provide a location.\nUsage: !weather Lagos');
                return;
            }

            try {
                const location = args.join(' ');
                const apiKey = '4902c0f2550f58298ad4146a92b65e10';
                const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`);

                const weather = response.data;
                const weatherText = `🌤️ *Weather in ${weather.name}, ${weather.sys.country}*\n\n` +
                    `🌡️ Temperature: ${weather.main.temp}°C\n` +
                    `🌡️ Feels like: ${weather.main.feels_like}°C\n` +
                    `📊 Humidity: ${weather.main.humidity}%\n` +
                    `🌪️ Wind: ${weather.wind.speed} m/s\n` +
                    `☁️ Condition: ${weather.weather[0].description}\n` +
                    `👁️ Visibility: ${weather.visibility / 1000} km`;

                await bot.sendMessage(chatId, weatherText);
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    await bot.sendMessage(chatId, '❌ Location not found. Please check the spelling and try again.');
                } else {
                    await bot.sendMessage(chatId, '❌ Error fetching weather data. Try again later!');
                }
            }
        }
    },

    define: {
        description: 'Get word definition',
        usage: 'define <word>',
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;

            if (args.length === 0) {
                await bot.sendMessage(chatId, '❌ Please provide a word to define.\nUsage: !define happiness');
                return;
            }

            const term = args.join(' ').trim();
            const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term)}`;

            try {
                const res = await fetch(url);

                // Handle HTTP errors explicitly
                if (!res.ok) {
                    if (res.status === 404) {
                        await bot.sendMessage(chatId, `❌ No definition found for "${term}".`);
                        return;
                    }
                    await bot.sendMessage(chatId, `❌ Dictionary API error (${res.status}). Try again later.`);
                    return;
                }

                const data = await res.json();
                if (!Array.isArray(data) || !data[0]) {
                    await bot.sendMessage(chatId, `❌ No definition found for "${term}".`);
                    return;
                }

                const entry = data[0];

                // Build response safely
                let out = `📖 *Definition of "${term}"*\n\n`;

                const phonetic = (entry.phonetics || []).find(p => p && p.text)?.text;
                if (phonetic) out += `🔊 Pronunciation: ${phonetic}\n\n`;

                if (Array.isArray(entry.meanings) && entry.meanings.length) {
                    // show up to 2 meanings, first definition each
                    entry.meanings.slice(0, 2).forEach(m => {
                        out += `*${m.partOfSpeech || 'meaning'}*\n`;
                        const def = Array.isArray(m.definitions) ? m.definitions[0] : undefined;
                        if (def?.definition) out += `• ${def.definition}\n`;
                        if (def?.example) out += `  _Example: ${def.example}_\n`;
                        out += '\n';
                    });
                } else {
                    out += '❌ No meanings available.\n';
                }

                await bot.sendMessage(chatId, out.trim());
            } catch (err) {
                // Make sure this always logs something useful
                console.error('Define command error:', err && (err.stack || err.message || err));
                await bot.sendMessage(chatId, '❌ Error fetching definition. Please try again later.');
            }
        }
    },

    lyrics: {
        description: 'Get song lyrics',
        usage: 'lyrics <song name>',
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;

            if (args.length === 0) {
                await bot.sendMessage(chatId, '❌ Please provide a song name.\nUsage: !lyrics Bohemian Rhapsody');
                return;
            }

            try {
                const song = args.join(' ');
                const response = await axios.get(`https://api.lyrics.ovh/v1/artist/song/${encodeURIComponent(song)}`);

                let lyrics = response.data.lyrics;

                // Truncate if too long
                if (lyrics.length > 1000) {
                    lyrics = lyrics.substring(0, 1000) + '...\n\n_Lyrics truncated for length_';
                }

                const lyricsText = `🎵 *Lyrics for "${song}"*\n\n${lyrics}`;
                await bot.sendMessage(chatId, lyricsText);
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Lyrics not found or error occurred. Try with artist name: "Artist - Song"');
            }
        }
    },

    tourl: {
        description: 'Upload image to get URL',
        usage: 'tourl (reply to image)',
        aliases: ["url"],
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
                await bot.sendMessage(chatId, '❌ Please reply to an image or send an image with the command.');
                return;
            }

            try {
                await bot.sendMessage(chatId, '⏳ Uploading image...');

                // Download image as buffer
                const buffer = await downloadMediaMessage(targetMessage, 'buffer', {});
                if (!buffer) {
                    await bot.sendMessage(chatId, '❌ Failed to download image.');
                    return;
                }

                // Save buffer to temp file
                const tempDir = path.join(__dirname, "..", "temp");
                if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

                const tempFile = path.join(tempDir, `upload_${Date.now()}.jpg`);
                fs.writeFileSync(tempFile, buffer);

                // Upload with image2url
                const imgbbKey = 'c7427b69f5258372a34457ff92d7e642';
                const uploadedUrl = await image2url.imgbb_upload(tempFile, imgbbKey);

                await bot.sendMessage(chatId, `✅ *Image uploaded successfully!*\n\n📎 URL: ${uploadedUrl}`);

                // Cleanup temp file
                fs.unlinkSync(tempFile);

            } catch (error) {
                console.error("❌ Upload error:", error);
                await bot.sendMessage(chatId, '❌ Error uploading image to server.');
            }
        }
    },

    movie: {
        description: 'Get movie information',
        usage: 'movie <movie name>',
        aliases: ["imdb"],
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot } = context;

            if (args.length === 0) {
                await bot.sendMessage(chatId, '❌ Please provide a movie name.\nUsage: !movie Avengers');
                return;
            }

            try {
                const movieName = args.join(' ');
                const response = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=thewdb`);
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

                if (movie.Poster && movie.Poster !== 'N/A') {
                    // send poster + details
                    const posterResponse = await axios.get(movie.Poster, { responseType: 'arraybuffer' });
                    const posterBuffer = Buffer.from(posterResponse.data, 'binary');

                    await bot.sendImage(chatId, posterBuffer, movieText);
                } else {
                    // fallback: send text only
                    await bot.sendText(chatId, movieText);
                }
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
                    await bot.sendImage(chatId, imageBuffer, animeText);
                } else {
                    await bot.sendMessage(chatId, { text: animeText });
                }

            } catch (err) {
                console.error('❌ Anime command error:', err);
                await bot.sendMessage(chatId, { text: '❌ Error fetching anime information. Try again later!' });
            }
        }
    },
};

module.exports = utilityCommands;