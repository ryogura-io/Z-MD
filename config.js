// const { settings } = require("./commands/admin");

const { tictactoe } = require("./commands/games");

// Default configuration
const defaultConfig = {
    prefix: '!',
    ownerName: 'Ryou',
    phoneNumber: '2348153827918@s.whatsapp.net', // Bot's phone number
    ownerNumber: [
        '2348153827918@s.whatsapp.net',
        '33381123379402@s.whatsapp.net',
        '270617702056168@lid',
    ], // Owner's WhatsApp number
    admins: [
        '2348153827918@s.whatsapp.net',
        '33381123379402@lid',
        '270617702056168@lid',
    ], // Admin numbers
    allowedGroups: [], // If empty, bot works in all groups
    commandCooldown: 2000, // 2 seconds
    settings: {
        autoWelcome: false,
        autoFarewell: false,
        deleteCommands: false,
        restrictToAdmins: false,
        mode: 'private', // 'public' or 'private'
        antiDelete: false,
        antiLink: false
    },
    reactions: {
        commands: {
            // 🏓 Basic
            help: '❓',
            h: '❓',
            menu: '❓',
            ping: '🏓',

            // 🛠️ Utility
            tts: '🔊',
            owner: '👑',
            joke: '😂',
            fact: '🧠',
            quote: '💭',
            weather: '🌤️',
            define: '📖',
            lyrics: '🎵',
            vv: '👀',

            // 🎨 Media
            sticker: '🎯',
            s: '🎯',
            toimg: '🖼️',
            tourl: '🔗',
            url: '🔗',
            tiny: '✂',

            // 🎬 Enhanced
            movie: '🎬',
            imdb: '🎬',
            anime: '🎌',
            ani: '🎌',

            // 🎮 Games
            hangman: '🪢',
            trivia: '❓',
            tictactoe: '⭕',
            ttt: '⭕',
            truth: '🗣️',
            dare: '🔥',
            word: '🔤',
            a: '🅰️',

            // ⬇️ Downloads
            play: '▶️',
            song: '🎶',
            tomp3: '🎶',
            instagram: '📸',
            ig: '📸',
            tiktok: '🎵',
            tt: '🎵',
            spotify: '🎵',
            youtube: '▶️',
            ytmp3: '🎧',
            waifu: '💮',
            wife: '💮',

            // 👥 Group
            promote: '⬆️',
            demote: '⬇️',
            kick: '👢',
            remove: '👢',
            add: '➕',
            setname: '📝',
            setdesc: '📜',
            close: '🔒',
            mute: '🔒',
            open: '🔓',
            unmute: '🔓',
            tag: '🏷️',
            tagall: '📣',
            admins: '🛡️',
            resetlink: '♻️',
            groupinfo: 'ℹ️',
            ginfo: 'ℹ️',
            link: '🔗',

            // 🔧 Admin
            ban: '🚫',
            unban: '✅',
            antilink: '🛑',

            // 👑 Owner
            mode: '⚙️',
            settings: '⚙️',
            setting: '⚙️',
            set: '⚙️',
            antidelete: '🗑️',
            setpp: '🖼️',
        },
        phoneNumbers: {
            // '33381123379402@lid': '🌟',
            // '270617702056168@lid': '💭',
        }
    }
};

class Config {
    constructor() {
        this.config = { ...defaultConfig };
        this.cooldowns = new Map();
    }

    // Get config value
    get(key) {
        return key ? this.config[key] : this.config;
    }

    // Set config value
    set(key, value) {
        this.config[key] = value;
        return true;
    }

    // Update settings
    updateSettings(settings) {
        this.config.settings = { ...this.config.settings, ...settings };
        return true;
    }

    // Admin management
    addAdmin(number) {
        if (!this.config.admins.includes(number)) {
            this.config.admins.push(number);
            return true;
        }
        return false;
    }

    removeAdmin(number) {
        const index = this.config.admins.indexOf(number);
        if (index > -1) {
            this.config.admins.splice(index, 1);
            return true;
        }
        return false;
    }

    isAdmin(number) {
        return this.config.admins.includes(number);
    }

    // Command cooldowns
    checkCooldown(userId, commandName) {
        const key = `${userId}-${commandName}`;
        const now = Date.now();
        const lastUsed = this.cooldowns.get(key);

        if (lastUsed && (now - lastUsed) < this.config.commandCooldown) {
            return false;
        }

        this.cooldowns.set(key, now);
        return true;
    }

    // Get emoji for a command
    getCommandEmoji(command) {
        return this.config.reactions.commands[command] || null;
    }

    // Get emoji for a phone number
    getNumberEmoji(number) {
        return this.config.reactions.phoneNumbers[number] || null;
    }

    // Get emoji for either command or phone
    getReaction({ command, number }) {
        return command ? this.getCommandEmoji(command) : this.getNumberEmoji(number);
    }
}

module.exports = new Config();
