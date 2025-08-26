const commands = require('./commands');
const config = require('./config');
const permissions = require('./utils/permissions');

class Bot {
    constructor(sock) {
        this.sock = sock;
        this.commands = commands;
    }

    async handleMessage(messageUpdate) {
        try {
            const messages = messageUpdate.messages;
            if (!messages || messages.length === 0) return;

            for (const message of messages) {
                await this.processMessage(message);
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

async processMessage(message) {
    try {
        // Skip if message is from status broadcast
        if (message.key.remoteJid === 'status@broadcast') return;

        // Skip if no message content
        if (!message.message) return;

        // Get message text
        const messageText = this.getMessageText(message);
        if (!messageText) return;

        // Check if message starts with prefix
        const prefix = config.get('prefix');
        if (!messageText.startsWith(prefix)) return;

        // Parse command
        const args = messageText.slice(prefix.length).trim().split(' ');
        const commandName = args.shift().toLowerCase();

        // Get sender info
        const sender = message.key.participant || message.key.remoteJid;
        const chatId = message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');

        // Check cooldown
        if (!config.checkCooldown(sender, commandName)) {
            await this.sendMessage(chatId, '⏰ Please wait before using this command again.');
            return;
        }

        // Check if command exists
        if (!this.commands[commandName]) {
            await this.sendMessage(chatId, `❌ Unknown command: ${commandName}\nUse ${prefix}help for available commands.`);
            return;
        }

        // Check permissions
        const command = this.commands[commandName];
        const hasPermission = await permissions.checkPermission(
            sender, 
            chatId, 
            command.adminOnly || false,
            this.sock
        );

        if (!hasPermission) {
            await this.sendMessage(chatId, '❌ You don\'t have permission to use this command.');
            return;
        }

        // --- ADD REACTION BEFORE EXECUTING COMMAND ---
        await this.addCommandReaction(message, commandName, sender);

        // Execute command
        const context = {
            sock: this.sock,
            message,
            args,
            sender,
            chatId,
            isGroup,
            messageText,
            bot: this
        };

        console.info(`Command executed: ${commandName} by ${sender} in ${chatId}`);
        await command.execute(context);

    } catch (error) {
        console.error('Error processing message:', error);
        const chatId = message.key.remoteJid;
        await this.sendMessage(chatId, '❌ An error occurred while processing your command.');
    }
}


    getMessageText(message) {
        const messageContent = message.message;
        
        if (messageContent.conversation) {
            return messageContent.conversation;
        }
        
        if (messageContent.extendedTextMessage?.text) {
            return messageContent.extendedTextMessage.text;
        }
        
        if (messageContent.imageMessage?.caption) {
            return messageContent.imageMessage.caption;
        }
        
        if (messageContent.videoMessage?.caption) {
            return messageContent.videoMessage.caption;
        }
        
        return null;
    }

    async sendMessage(chatId, text, options = {}) {
        try {
            await this.sock.sendMessage(chatId, {
                text: text,
                ...options
            });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    async sendImage(chatId, buffer, caption = '') {
        try {
            await this.sock.sendMessage(chatId, {
                image: buffer,
                caption: caption
            });
        } catch (error) {
            console.error('Error sending image:', error);
        }
    }

    async sendVideo(chatId, buffer, caption = '') {
        try {
            await this.sock.sendMessage(chatId, {
                video: buffer,
                caption: caption
            });
        } catch (error) {
            console.error('Error sending video:', error);
        }
    }

    async sendAudio(chatId, buffer) {
        try {
            await this.sock.sendMessage(chatId, {
                audio: buffer,
                mimetype: 'audio/mp4'
            });
        } catch (error) {
            console.error('Error sending audio:', error);
        }
    }

    async handleGroupUpdate(updates) {
        try {
            for (const update of updates) {
                console.info('Group update:', update);
                // Handle group setting changes
                if (update.announce !== undefined || update.restrict !== undefined) {
                    // Group settings changed
                }
            }
        } catch (error) {
            console.error('Error handling group update:', error);
        }
    }

    async handleParticipantsUpdate(update) {
        try {
            const { id: groupId, participants, action } = update;
            
            if (!config.get('settings').autoWelcome && !config.get('settings').autoFarewell) {
                return;
            }

            for (const participant of participants) {
                if (action === 'add' && config.get('settings').autoWelcome) {
                    await this.sendMessage(groupId, `👋 Welcome to the group, @${participant.split('@')[0]}!`);
                } else if (action === 'remove' && config.get('settings').autoFarewell) {
                    await this.sendMessage(groupId, `👋 Goodbye @${participant.split('@')[0]}!`);
                }
            }
        } catch (error) {
            console.error('Error handling participants update:', error);
        }
    }

    async addCommandReaction(message, commandName, sender) {
        try {
            const reactions = config.get('reactions');
            let reactionEmoji = null;
            
            // Then check for command specific reaction
            if (reactions.commands[commandName]) {
                reactionEmoji = reactions.commands[commandName];
            }
            // Check for phone number specific reaction first
            else if (reactions.phoneNumbers[sender]) {
                reactionEmoji = reactions.phoneNumbers[sender];
            } 
            
            if (reactionEmoji) {
                await this.sock.sendMessage(message.key.remoteJid, {
                    react: {
                        text: reactionEmoji,
                        key: message.key
                    }
                });
            }
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    }
}

module.exports = Bot;
