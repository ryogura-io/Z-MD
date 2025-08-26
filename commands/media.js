const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const mediaUtils = require('../utils/media');
const config = require('../config');

const mediaCommands = {
    download: {
        description: 'Download media from replied message',
        usage: 'download',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, bot, message } = context;
            
            // Check if replying to a message
            const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMessage) {
                await bot.sendMessage(chatId, '❌ Please reply to a message containing media.');
                return;
            }
            
            try {
                // Check if quoted message has media
                const hasMedia = quotedMessage.imageMessage || 
                               quotedMessage.videoMessage || 
                               quotedMessage.audioMessage || 
                               quotedMessage.documentMessage;
                
                if (!hasMedia) {
                    await bot.sendMessage(chatId, '❌ The replied message does not contain any media.');
                    return;
                }
                
                await bot.sendMessage(chatId, '⏳ Downloading media...');
                
                // Create a fake message object for download
                const fakeMessage = {
                    key: message.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMessage
                };
                
                const buffer = await downloadMediaMessage(fakeMessage, 'buffer', {});
                
                if (!buffer) {
                    await bot.sendMessage(chatId, '❌ Failed to download media.');
                    return;
                }
                
                // Check file size
                if (buffer.length > config.get('mediaDownloadLimit')) {
                    await bot.sendMessage(chatId, '❌ Media file is too large to download.');
                    return;
                }
                
                // Determine media type and send
                if (quotedMessage.imageMessage) {
                    await bot.sendImage(chatId, buffer, '📥 Downloaded Image');
                } else if (quotedMessage.videoMessage) {
                    await bot.sendVideo(chatId, buffer, '📥 Downloaded Video');
                } else if (quotedMessage.audioMessage) {
                    await bot.sendAudio(chatId, buffer);
                } else if (quotedMessage.documentMessage) {
                    await bot.sendMessage(chatId, '📥 Document downloaded successfully.');
                }
                
            } catch (error) {
                console.error('Download error:', error);
                await bot.sendMessage(chatId, '❌ Error downloading media.');
            }
        }
    },
    
    sticker: {
        description: 'Convert image to sticker',
        usage: 'sticker (reply to image)',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, bot, message, sock } = context;
            
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
                await bot.sendMessage(chatId, '❌ Please reply to an image or send an image with the sticker command.');
                return;
            }
            
            try {
                await bot.sendMessage(chatId, '⏳ Converting to sticker...');
                
                const buffer = await downloadMediaMessage(targetMessage, 'buffer', {});
                
                if (!buffer) {
                    await bot.sendMessage(chatId, '❌ Failed to download image.');
                    return;
                }
                
                // Process image for sticker
                const stickerBuffer = await mediaUtils.processImageForSticker(buffer);
                
                if (!stickerBuffer) {
                    await bot.sendMessage(chatId, '❌ Failed to process image for sticker.');
                    return;
                }
                
                // Send as sticker
                await sock.sendMessage(chatId, {
                    sticker: stickerBuffer
                });
                
            } catch (error) {
                console.error('Sticker error:', error);
                await bot.sendMessage(chatId, '❌ Error creating sticker.');
            }
        }
    },
    
    compress: {
        description: 'Compress an image or video',
        usage: 'compress (reply to media)',
        adminOnly: false,
        execute: async (context) => {
            const { chatId, bot, message } = context;
            
            const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMessage) {
                await bot.sendMessage(chatId, '❌ Please reply to a message containing an image or video.');
                return;
            }
            
            const hasMedia = quotedMessage.imageMessage || quotedMessage.videoMessage;
            if (!hasMedia) {
                await bot.sendMessage(chatId, '❌ The replied message does not contain an image or video.');
                return;
            }
            
            try {
                await bot.sendMessage(chatId, '⏳ Compressing media...');
                
                const fakeMessage = {
                    key: message.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMessage
                };
                
                const buffer = await downloadMediaMessage(fakeMessage, 'buffer', {});
                
                if (!buffer) {
                    await bot.sendMessage(chatId, '❌ Failed to download media.');
                    return;
                }
                
                let compressedBuffer;
                
                if (quotedMessage.imageMessage) {
                    compressedBuffer = await mediaUtils.compressImage(buffer);
                    if (compressedBuffer) {
                        await bot.sendImage(chatId, compressedBuffer, '🗜️ Compressed Image');
                    }
                } else if (quotedMessage.videoMessage) {
                    await bot.sendMessage(chatId, '⚠️ Video compression not available in this version.');
                    return;
                }
                
                if (!compressedBuffer) {
                    await bot.sendMessage(chatId, '❌ Failed to compress media.');
                }
                
            } catch (error) {
                console.error('Compression error:', error);
                await bot.sendMessage(chatId, '❌ Error compressing media.');
            }
        }
    }
};

module.exports = mediaCommands;
