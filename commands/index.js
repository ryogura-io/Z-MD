const helpCommand = require('./help');
const adminCommands = require('./admin');
const groupCommands = require('./group');
const mediaCommands = require('./media');
const utilityCommands = require('./utility');
const enhancedCommands = require('./enhanced');
const gameCommands = require('./games');
const funCommands = require('./fun');
const downloaderCommands = require('./downloaders');
const ownerCommands = require('./owner');

// Combine all commands
const commands = {
    ...helpCommand,
    ...adminCommands,
    ...groupCommands,
    ...mediaCommands,
    ...utilityCommands,
    ...enhancedCommands,
    ...gameCommands,
    ...funCommands,
    ...downloaderCommands,
    ...ownerCommands
};

module.exports = commands;
