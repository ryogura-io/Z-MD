const gtts = require('gtts');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

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
            
            try {
                const word = args[0];
                const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
                const definition = response.data[0];
                
                let definitionText = `📖 *Definition of "${word}"*\n\n`;
                
                if (definition.phonetics && definition.phonetics[0] && definition.phonetics[0].text) {
                    definitionText += `🔊 Pronunciation: ${definition.phonetics[0].text}\n\n`;
                }
                
                definition.meanings.forEach((meaning, index) => {
                    if (index < 2) { // Limit to 2 meanings
                        definitionText += `*${meaning.partOfSpeech}*\n`;
                        if (meaning.definitions[0]) {
                            definitionText += `• ${meaning.definitions[0].definition}\n`;
                            if (meaning.definitions[0].example) {
                                definitionText += `  _Example: ${meaning.definitions[0].example}_\n`;
                            }
                        }
                        definitionText += '\n';
                    }
                });
                
                await bot.sendMessage(chatId, definitionText);
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    await bot.sendMessage(chatId, '❌ Word not found in dictionary. Please check the spelling.');
                } else {
                    await bot.sendMessage(chatId, '❌ Error fetching definition. Try again later!');
                }
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
    }
};

module.exports = utilityCommands;