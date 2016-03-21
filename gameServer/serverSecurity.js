var sett = require('./globals.js').serverSettings;
module.exports = {
    forbiddenNames: ['root', 'admin', 'SERVER', 'lobby', sett.chatBotName],
    forbiddenRooms: ['root', 'admin', 'lobby', 'SERVER', 'blankcards'],
    chatBanned: [],
    globalBanned: []
};
