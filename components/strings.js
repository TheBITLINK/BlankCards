var fs = require('fs');
var sett = require('./serverInfo.js');
var defstr = {
	"locale": "en-us",
	"by": "TheBITLINK",
	"shared":
	{
		"ok": "Ok",
		"cancel": "Cancel",
		"username": "Username",
		"room": "Room",
		"rooms": "Rooms",
		"player": "Player",
		"players": "Players",
		"alert": "Alert",
		"confirmation": "Confirmation",
		"entertext": "Enter Text..."
	},
	"ui": {
		"userprefs":
		{
			"header": "User Preferences",
			"usernamewarn": "Changing your username will require the game to reload!",
			"ignoredusers": "Ignored/Blocked users (comma separated)",
			"ignoredusersph": "You'll not see chat messages from these users."
		},
		"newroom":
		{
			"header": "Create New Room",
			"basic": "Basic",
			"cardpacks": "Card Decks",
			"advanced": "Advanced",
			"roomname": "Room name (no spaces)",
			"roomdesc": "Room description",
			"roompass": "Room password (leave empty for no password)",
			"public": "Public",
			"private": "Private",
			"searchC": "Search default or \"CC:{CardCastID}\""
		}
	},
	"server":
	{
		"errors":{
			"forbiddenname": "The username you have chosen is forbidden, please use another one.",
			"globalbanned": "Your IP address is currently banned.",
			"inuse": "Username already in use, please use another one."
		},
		"login": "Please enter your username (you can change it later in settings)",
		"translationcredits": []
	},
	"chat":
	{
		"placeholder": "Chat...",
		"commandnotfound": "*Invalid Command*. Use /help for a list of commands.",
		"commandlist": [
			"Avaiable commands:\n",
			"*/help*: Shows this help.",
			"*/roll* ~n~: Gives a random number between 0 and n",
			"*/me* ~act~: Displays an action.",
			"*/info*: Server Information"
		],
		"roll": "*{p}* rolls number {n1}/{n2}",
		"roll2big": "Number too big"
	},
	"lobby":{
		"newroom": "New Room",
		"cantjoin": "Can't join #{r}"		
	},
	"waiting":
	{
		"waitingforplayers": "Waiting for players...",
		"youneed3": "You need at least 3 people to play Blank Cards properly.",
		"waitorshare": "You can either wait or give the link to 2 or more friends",
		"copylink": "Copy link",
		"copyNotSupported": "Copying is not supported in your browser, copy the link manually instead.",
		"joinnext": "You'll join in the next round",
		"spectnotsupported": "(Spectating is not yet supported)"
	},
	"room":
	{
		"leavealert": "If you leave the room, it'll be deleted",
		"notexist": "Room doesn't seem to exist. Create one?",
		"alreadyexist": "This room already exists",
		"password": "This room is protected by password, please enter it bellow",
		"incpassword": "Incorrect password. Try Again",
		"full": "Room is full, please choose another or create one.",
		"forbiddenname": "You can't create a room with that name."
	},
	"game":
	{
		"time": "Time",
		"wcards": "Your white cards:",
		"youareczar": "You are the card czar.",
		"czar": "{p} is the card czar for this round.",
		"win": "{p} wins this round",
		"timeout": "Out of time.",
		"leave": "{p} leaved the game.",
		"over": "Game Over",
		"winner": "{p} wins the game!"
	}
}

module.exports = defstr;

if(fs.existsSync("strings/"+sett.serverLocale+".json"))
{
	var localstr = fs.readFileSync("strings/"+sett.serverLocale+".json");
	module.exports = Object.assign(defstr, JSON.parse(localstr));
}