// Simple game storage (in-memory)
const gameStates = new Map();
const axios = require("axios");

const gameCommands = {
    hangman: {
        description: 'Start a hangman game',
        usage: 'hangman',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, bot, sock } = context;

            async function getRandomWord() {
                try {
                    const res = await fetch('https://random-word-api.herokuapp.com/word?number=1');
                    const data = await res.json();
                    return data[0]; // API returns an array of words
                } catch (error) {
                    console.error('Random word API failed, falling back:', error.message);
                    const fallbackWords = ['javascript', 'whatsapp', 'computer', 'programming', 'android', 'technology', 'artificial', 'intelligence'];
                    return fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
                }
            }

            try {
                const word = (await getRandomWord()).toLowerCase();

                const gameState = {
                    word,
                    guessed: Array(word.length).fill('_'),
                    wrongGuesses: [],
                    maxWrong: 6,
                    gameType: 'hangman'
                };

                gameStates.set(chatId, gameState);

                const gameText = `🎮 *Hangman Game Started!*\n\n` +
                    `Word: ${gameState.guessed.join(' ')}\n` +
                    `Wrong guesses: ${gameState.wrongGuesses.length}/${gameState.maxWrong}\n\n` +
                    `Use !a <letter> to guess a letter!`;

                await bot.sendMessage(chatId, gameText);
            } catch (err) {
                console.error('Hangman command error:', err);
                await bot.sendMessage(chatId, '⚠️ Could not start a new hangman game. Please try again.');
            }
        }
    },

    trivia: {
        description: 'Start a trivia game',
        usage: 'trivia',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, bot, sock } = context;

            try {
                // ✅ Fetch 1 trivia question
                const res = await axios.get("https://opentdb.com/api.php?amount=1&type=multiple");
                const data = res.data.results[0];

                // Decode HTML entities (sometimes OpenTDB returns `&quot;`)
                const he = require("he");
                const question = he.decode(data.question);
                const correct = he.decode(data.correct_answer);
                const options = [...data.incorrect_answers.map(o => he.decode(o)), correct];

                // Shuffle options
                options.sort(() => Math.random() - 0.5);

                // ✅ Store game state
                const gameState = {
                    question,
                    answer: correct.toLowerCase(),
                    options,
                    gameType: 'trivia'
                };
                gameStates.set(chatId, gameState);

                // ✅ Send question
                const gameText = `🧠 *Trivia Question*\n\n${question}\n\n` +
                    options.map((o, i) => `${i + 1}. ${o}`).join("\n") +
                    `\n\nUse !a <answer> to reply! (you can type the full answer or the number)`;

                await bot.sendMessage(chatId, gameText);

            } catch (err) {
                console.error("Trivia error:", err.message);
                await bot.sendMessage(chatId, "⚠️ Couldn't fetch a trivia question, try again later.");
            }
        }
    },

    tictactoe: {
        description: 'Play TicTacToe with another user',
        usage: 'tictactoe',
        aliases: ['ttt'],
        adminOnly: false,
        execute: async (context) => {
            const { chatId, bot, sender, message } = context;
            const TicTacToe = require('../utils/tictactoe');

            // Check if game already exists
            if (gameStates.has(chatId) && gameStates.get(chatId).gameType === 'tictactoe') {
                await bot.sendMessage(chatId, '❌ A TicTacToe game is already running here! Use !a <move> to play.');
                return;
            }

            // Ensure a second player (must mention or reply)
            let opponent;
            if (message?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                opponent = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (message?.message?.extendedTextMessage?.contextInfo?.participant) {
                opponent = message.message.extendedTextMessage.contextInfo.participant;
            }

            if (!opponent) {
                await bot.sendMessage(chatId, '❌ Please mention or reply to someone to challenge them.');
                return;
            }

            if (opponent === sender) {
                await bot.sendMessage(chatId, '❌ You cannot play against yourself.');
                return;
            }

            // Create new game
            const game = new TicTacToe(sender, opponent);
            const state = {
                game,
                gameType: 'tictactoe'
            };
            gameStates.set(chatId, state);

            const board = game.render().map(v => ({
                'X': '❎',
                'O': '⭕',
                '1': '1️⃣',
                '2': '2️⃣',
                '3': '3️⃣',
                '4': '4️⃣',
                '5': '5️⃣',
                '6': '6️⃣',
                '7': '7️⃣',
                '8': '8️⃣',
                '9': '9️⃣',
            }[v]));

            const msg = `
🎮 *TicTacToe Started!*
Player ❎: @${sender.split('@')[0]}
Player ⭕: @${opponent.split('@')[0]}

${board.slice(0, 3).join('')}
${board.slice(3, 6).join('')}
${board.slice(6).join('')}

Turn: @${game.currentTurn.split('@')[0]} (❎)

Use !a <1-9> to make a move, or type !a surrender to give up.
`;

            await bot.sendMessage(chatId, msg, { mentions: [sender, opponent] });
        }
    },


    truth: {
        description: 'Get a truth question',
        usage: 'truth',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, bot, sock } = context;

            try {
                const response = await axios.get("https://api.truthordarebot.xyz/v1/truth");

                if (response.data && response.data.question) {
                    const truth = response.data.question;
                    await bot.sendMessage(chatId, `💭 *Truth Question*\n\n${truth}`);
                } else {
                    await bot.sendMessage(chatId, "❌ Couldn't fetch a truth question, try again later!");
                }
            } catch (error) {
                console.error("Error fetching truth:", error.message);
                await bot.sendMessage(chatId, "⚠️ Failed to fetch truth. Please try again later.");
            }
        }
    },

    dare: {
        description: 'Get a dare challenge',
        usage: 'dare',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, bot, sock } = context;

            try {
                const response = await axios.get("https://api.truthordarebot.xyz/v1/dare");

                if (response.data && response.data.question) {
                    const dare = response.data.question;
                    await bot.sendMessage(chatId, `🎯 *Dare Challenge*\n\n${dare}`);
                } else {
                    await bot.sendMessage(chatId, "❌ Couldn't fetch a dare challenge, try again later!");
                }
            } catch (error) {
                console.error("Error fetching dare:", error.message);
                await bot.sendMessage(chatId, "⚠️ Failed to fetch dare. Please try again later.");
            }
        }
    },

    wordladder: {
        description: 'Word ladder puzzle',
        usage: 'wordladder',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, bot, sock } = context;
            const start = 'cat';
            const end = 'dog';
            const text = `🔤 Change ${start} to ${end} one letter at a time (e.g., cat -> cot -> cog -> dog). Reply with steps.`;
            await bot.sendMessage(chatId, text);
            // Note: Manual user solve; bot can validate if replied.
        }
    },

    word: {
        description: 'Start a word association game',
        usage: 'word',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, bot, sock } = context;

            const startWords = ['technology', 'ocean', 'music', 'adventure', 'friendship', 'nature', 'creativity'];
            const word = startWords[Math.floor(Math.random() * startWords.length)];

            const gameState = {
                currentWord: word,
                gameType: 'word'
            };

            gameStates.set(chatId, gameState);

            const gameText = `📝 *Word Association Game*\n\nCurrent word: *${word}*\n\nUse !a <word> to continue the chain!`;
            await bot.sendMessage(chatId, gameText);
        }
    },

    a: {
        description: 'Answer/reply in games',
        usage: 'a <answer>',
        adminOnly: false,
        execute: async (context) => {
            const { args, chatId, bot, sock } = context;

            if (args.length === 0) {
                await bot.sendMessage(chatId, '❌ Please provide an answer.\nUsage: !a <your answer>');
                return;
            }

            const gameState = gameStates.get(chatId);
            if (!gameState) {
                await bot.sendMessage(chatId, '❌ No active game. Start a game first!');
                return;
            }

            const answer = args.join(' ').toLowerCase();

            switch (gameState.gameType) {
                case 'hangman':
                    await handleHangmanGuess(gameState, answer, chatId, bot);
                    break;
                case 'trivia':
                    await handleTriviaAnswer(gameState, answer, chatId, bot);
                    break;
                case 'word':
                    await handleWordAssociation(gameState, answer, chatId, bot);
                    break;
                case 'tictactoe':
                    await handleTicTacToeMove(gameState, answer, chatId, bot, context.sender);
                    break;
                default:
                    await bot.sendMessage(chatId, '❌ Unknown game type.');
            }
        }
    },

    answer: {
        description: 'Answer/reply in games (alias)',
        usage: 'answer <answer>',
        adminOnly: false,
        execute: async (context) => {
            return gameCommands.a.execute(context);
        }
    }
};

async function handleHangmanGuess(gameState, guess, chatId, bot) {
    if (guess.length !== 1) {
        await bot.sendMessage(chatId, '❌ Please guess only one letter at a time.');
        return;
    }

    const letter = guess[0];

    if (gameState.word.includes(letter)) {
        // Correct guess
        for (let i = 0; i < gameState.word.length; i++) {
            if (gameState.word[i] === letter) {
                gameState.guessed[i] = letter;
            }
        }

        if (!gameState.guessed.includes('_')) {
            gameStates.delete(chatId);
            await bot.sendMessage(chatId, `🎉 *You won!*\n\nThe word was: *${gameState.word}*`);
            return;
        }

        const gameText = `✅ Correct!\n\nWord: ${gameState.guessed.join(' ')}\n` +
            `Wrong guesses: ${gameState.wrongGuesses.length}/${gameState.maxWrong}`;
        await bot.sendMessage(chatId, gameText);
    } else {
        // Wrong guess
        gameState.wrongGuesses.push(letter);

        if (gameState.wrongGuesses.length >= gameState.maxWrong) {
            gameStates.delete(chatId);
            await bot.sendMessage(chatId, `💀 *Game Over!*\n\nThe word was: *${gameState.word}*`);
            return;
        }

        const gameText = `❌ Wrong letter!\n\nWord: ${gameState.guessed.join(' ')}\n` +
            `Wrong guesses: ${gameState.wrongGuesses.join(', ')} (${gameState.wrongGuesses.length}/${gameState.maxWrong})`;
        await bot.sendMessage(chatId, gameText);
    }
}

async function handleTriviaAnswer(gameState, answer, chatId, bot) {
    let userAnswer = answer;

    // If user typed a number (e.g. "2"), map it to option
    if (!isNaN(userAnswer)) {
        const index = parseInt(userAnswer, 10) - 1;
        if (gameState.options[index]) {
            userAnswer = gameState.options[index].toLowerCase();
        }
    }

    if (userAnswer === gameState.answer.toLowerCase()) {
        gameStates.delete(chatId);
        await bot.sendMessage(chatId, `🎉 *Correct!*\n\nThe answer was: *${gameState.answer}*`);
    } else {
        gameStates.delete(chatId);
        await bot.sendMessage(chatId, `❌ *Wrong!*\n\nThe correct answer was: *${gameState.answer}*`);
    }
}


async function handleWordAssociation(gameState, newWord, chatId, bot) {
    gameState.currentWord = newWord;
    await bot.sendMessage(chatId, `📝 New word: *${newWord}*\n\nNext player, continue the association!`);
}

async function handleTicTacToeMove(gameState, input, chatId, bot, sender) {
    const game = gameState.game;
    const surrender = /^(surrender|give up)$/i.test(input);

    if (!surrender && !/^[1-9]$/.test(input)) return;

    if (!surrender && sender !== game.currentTurn) {
        await bot.sendMessage(chatId, '❌ Not your turn!', { mentions: [sender] });
        return;
    }

    let moveOk = surrender ? true : game.turn(sender === game.playerO, parseInt(input) - 1);

    if (!moveOk) {
        await bot.sendMessage(chatId, '❌ Invalid move!');
        return;
    }

    let winner = game.winner;
    let isTie = game.turns >= 9 && !winner;

    if (surrender) {
        winner = sender === game.playerX ? game.playerO : game.playerX;
    }

    const board = game.render().map(v => ({
        'X': '❎',
        'O': '⭕',
        '1': '1️⃣',
        '2': '2️⃣',
        '3': '3️⃣',
        '4': '4️⃣',
        '5': '5️⃣',
        '6': '6️⃣',
        '7': '7️⃣',
        '8': '8️⃣',
        '9': '9️⃣',
    }[v]));

    let status;
    if (winner) {
        status = `🎉 @${winner.split('@')[0]} wins the game!`;
    } else if (isTie) {
        status = `🤝 It's a draw!`;
    } else {
        status = `🎲 Turn: @${game.currentTurn.split('@')[0]}`;
    }

    const msg = `
🎮 *TicTacToe Game*

${status}

${board.slice(0, 3).join('')}
${board.slice(3, 6).join('')}
${board.slice(6).join('')}

Player ❎: @${game.playerX.split('@')[0]}
Player ⭕: @${game.playerO.split('@')[0]}
`;

    await bot.sendMessage(chatId, msg, { mentions: [game.playerX, game.playerO] });

    if (winner || isTie) {
        gameStates.delete(chatId);
    }
}




module.exports = gameCommands;
