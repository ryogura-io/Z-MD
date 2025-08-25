const pino = require('pino');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Create logger with file and console transport
const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
        level: (label) => {
            return { level: label.toUpperCase() };
        }
    }
}, pino.multistream([
    // Console output
    {
        level: 'info',
        stream: pino.destination({
            sync: false
        })
    },
    // File output
    {
        level: 'debug',
        stream: pino.destination({
            dest: path.join(logsDir, 'bot.log'),
            sync: false
        })
    },
    // Error file output
    {
        level: 'error',
        stream: pino.destination({
            dest: path.join(logsDir, 'error.log'),
            sync: false
        })
    }
]));

// Add custom methods for different log levels
const customLogger = {
    info: (message, ...args) => {
        logger.info(args.length > 0 ? { extra: args } : {}, message);
    },
    
    error: (message, ...args) => {
        logger.error(args.length > 0 ? { extra: args } : {}, message);
    },
    
    warn: (message, ...args) => {
        logger.warn(args.length > 0 ? { extra: args } : {}, message);
    },
    
    debug: (message, ...args) => {
        logger.debug(args.length > 0 ? { extra: args } : {}, message);
    },
    
    fatal: (message, ...args) => {
        logger.fatal(args.length > 0 ? { extra: args } : {}, message);
    },
    
    // Log command execution
    logCommand: (commandName, userId, chatId, args = []) => {
        logger.info({
            type: 'command',
            command: commandName,
            user: userId,
            chat: chatId,
            args: args
        }, `Command executed: ${commandName}`);
    },
    
    // Log media processing
    logMedia: (action, userId, chatId, mediaType, size = 0) => {
        logger.info({
            type: 'media',
            action: action,
            user: userId,
            chat: chatId,
            mediaType: mediaType,
            size: size
        }, `Media ${action}: ${mediaType}`);
    },
    
    // Log group actions
    logGroup: (action, userId, chatId, targetUser = null) => {
        logger.info({
            type: 'group',
            action: action,
            user: userId,
            chat: chatId,
            target: targetUser
        }, `Group action: ${action}`);
    },
    
    // Log authentication events
    logAuth: (event, details = {}) => {
        logger.info({
            type: 'auth',
            event: event,
            ...details
        }, `Auth event: ${event}`);
    },
    
    // Log errors with context
    logError: (error, context = {}) => {
        logger.error({
            type: 'error',
            error: error.message,
            stack: error.stack,
            context: context
        }, `Error occurred: ${error.message}`);
    }
};

module.exports = customLogger;
