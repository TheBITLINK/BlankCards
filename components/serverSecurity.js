var sett = require('./serverInfo.js');
module.exports = {
	forbiddenNames: ["root", "admin", "SERVER", "lobby", sett.chatBotName],
	forbiddenRooms: ["root", "admin", "lobby", "SERVER", "blankcards"],
	chatBanned: [],
	globalBanned: []
}