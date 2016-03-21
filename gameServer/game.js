var fs = require('fs');
var str = require('./strings.js');
var srv = require('./globals.js').serverSettings;
var http = require('https');
module.exports = function(p, players, rooms, roomname)
{
	var room = rooms[roomname];
	var bId = (typeof room.decks != 'undefined') ? room.decks : srv.defdeck;
	var decks = [];
	var whiteCards = [];
	var avWhite = [];
	var blackCards = [];
	var avBlack = [];
	bId.forEach(function(el, i) {
		if(el.startsWith("CC:")||el.startsWith("cc:"))
		{
			var id = el.split(':')[1];
			http.request({host:'api.cardcastgame.com', path: '/v1/decks/'+id+'/cards'}, function(response)
			{
				var str = '';
			    response.on('data', function (chunk) {
					str += chunk;
				});
				response.on('end', function () {
					try{
						var oriDeck = JSON.parse(str);
						// Convert deck from cardcast format to BlankCards
						var dd = {}
						dd.type = "CardCast";
						dd.BlackCards = oriDeck.calls;
						dd.WhiteCards = oriDeck.responses;
						decks.push(dd);
						if(decks.length == bId.length)init();
					}
					catch(er)
					{
						// Placeholder Deck
						decks.push({type:"Placeholder",BlackCards:[],WhiteCards:[]});
						if(decks.length == bId.length)init();
					}
				});
			}).end();
		}
		else
		{
			// Sorry about the callback hell
			fs.exists("decks/"+el+"/"+srv.locale+".json", function(e)
			{
				var p = e?"decks/"+el+"/"+srv.serverLocale+".json":"decks/"+el+"/default.json";
				fs.readFile("decks/"+el+"/default.json", function(err, dt)
				{
					err? decks.push({type:"Placeholder",BlackCards:[],WhiteCards:[]}) : decks.push(JSON.parse(dt));
					if(decks.length == bId.length)init();
				});
			});
		}
	}, this);
	var owner = "";
	var timer;
	var cb = "";
	var chosenw = [];
	var members = {};
	var cz = 0;
	var deltm = -1;
	
	function init()
	{
		p.socket.emit("joinroom", rooms[roomname]);
		// Merge all decks
		decks.forEach(function(el,i)
		{
			// For some weird reason, push() doesn't work here
			el.WhiteCards.forEach(function(eb){whiteCards.push(eb)});
			el.BlackCards.forEach(function(eb){blackCards.push(eb)});
			//whiteCards.push({id:''+Math.random(), text: "*"});
		});
		// Create 2 arrays with shuffled cards
		avWhite = whiteCards.slice(0);
		shuffle(avWhite);
	 	avBlack = blackCards.slice(0);
		shuffle(avBlack);
		// Give 6 white cards to each player
		room.Players.forEach(function(pname)
		{
			var ii = 1;
			var tC = [];
			while(tC.length < 5)
			{
				if(avWhite.length >= 1)
				{
					tC.push(avWhite.shift());
				}
				else
				{
					avWhite = whiteCards.slice(0);
					shuffle(avWhite);
					tC.push(avWhite.shift());
				}
			}
			members[pname] = {wC: tC, sc: 0};
			players[pname].socket.on("playCards", function(wh){playCards(wh, pname)});
			players[pname].socket.on("cze", function(n){czer(n,pname)})
	});
	emit('memberinfo', members);
	nextRound();
	}
	
	function shuffle(array) {
		var currentIndex = array.length, temporaryValue, randomIndex ;
		while (0 !== currentIndex) {
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;
			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}
		return array;
	}
	
	Array.observe(room.Players, function(ch){
		ch.forEach(function(el){
			if(el.addedCount > 0)
			{
				var pname = room.Players[el.index];
				// A player joined
					var ii = 1;
					var tC = [];
					while(tC.length < 5)
					{
						if(avWhite.length >= 1)
						{
							tC.push(avWhite.shift());
						}
						else
						{
							avWhite = whiteCards.slice(0);
							shuffle(avWhite);
							tC.push(avWhite.shift());
						}
					}
					pendingmembers[pname] = {wC: tC, sc: 0};
					//players[pname].socket.emit('nextRound', {blackCard: cb, czar: czar, members: members});
					players[pname].socket.emit('chat', 'SERVER', str.waiting.joinnext);
					players[pname].socket.emit('waitforplayers', true);
					players[pname].socket.on("playCards", function(wh){playCards(wh, pname)});
					players[pname].socket.on("cze", function(n){czer(n,pname)})
			}
			if(el.type == "delete")
			{
				// RIP ;_;
				delete members[el.oldValue];
				delete pendingmembers[el.oldValue];
				if(Object.keys(members).length <= 0)
				{
					// If there are no players, delete the room
					delete rooms[roomname];
				}
				emit('memberinfo', members);
				playerLeave(el.oldValue);
			}
		});
		if(waiting)
		{
			nextRound();
		}
	});
	
	
	function emit()
	{
		if(arguments.length < 1)return;
		var args = arguments;
		room.Players.forEach(function(el){
			players[el].socket.emit.apply(players[el].socket, args);
		});
	}
	
	var waiting = false;
	
	function wait()
	{
		waiting = true;
		emit("waitforplayers", false);
		emit("setTimer", 0);
		clearTimeout(timer);
	}
	
	var roundCards = {};
	var pendingmembers = {};
	
	function nextRound()
	{
		Object.keys(pendingmembers).forEach(function(m)
		{
			members[m] = pendingmembers[m];
			emit('memberinfo', members);
		});
		pendingmembers = {};
		// If there are less than 3, it doesn't make sense
		if(Object.keys(members).length < 3){
			wait();
			return;
		}
		else
		{
			waiting = false;
			emit("stopwaiting");
		}
		var aW = false;
		Object.keys(members).forEach(function(el) {
			if(members[el].sc >= 10){win(el);aW = true;}
		}, this);
		if(aW)return;
		// Select next black card
		if(avBlack.length > 1)
		{
			cb = avBlack.shift();
		}
		else
		{
			avBlack = blackCards.slice(0);
		    shuffle(avBlack);
			cb = avBlack.shift();
		}
		roundCards = {};
		// Select a czar
		if(cz < Object.keys(members).length -1)
		{
			cz++;
		}
		else
		{
			cz = 0;
		}
		czar = Object.keys(members)[cz];
		// Reset Timer
		clearTimeout(timer);
		czarTime = false;
		timer = setTimeout(noTime, 120000);
		emit("setTimer", 120);
		// Give a white card to each player
		for(var member in members)
		{
			if(avWhite.length >= 1)
				{
					members[member].wC.push(avWhite.shift());
				}
				else
				{
					avWhite = whiteCards.slice(0);
					shuffle(avWhite);
					members[member].wC.push(avWhite.shift());
				}
		}
		// Send data
		emit("nextRound", {blackCard: cb, czar: czar, members: members});
		emit("chat", "SERVER", str.game.czar.replace('{p}',czar));
	}
	
	var czar;
	
	function win(n)
	{
		emit('win', n);
		clearTimeout(timer);
		emit("setTimer", 0);
		delete rooms[roomname];
	}
	
	function noTime()
	{
		emit('chat', 'SERVER', str.game.timeout);
		var rcn = Object.keys(roundCards);
		if(rcn.length <= 1){nextRound();return;}
		if(czarTime){nextRound();return;}
		cze();
	}
	
	function playerLeave(pn)
	{
		emit('chat', 'SERVER', str.game.leave.replace('{p}', pn))
		if(pn == czar||Object.keys(members).length < 3){nextRound();return;}
		if(czarTime||Object.keys(roundCards).indexOf(pn) != -1){return;}
		if(Object.keys(roundCards).length >= Object.keys(members).length -1)cze();
	}
	
	function playCards(wh, pname){
		// Anti-cheating
		if(pname == czar){cheatDetected(); return;}
		if(typeof roundCards[pname] != 'undefined'){cheatDetected();return;}
		if(wh.length > cb.text.length){cheatDetected();return;}
		var inil = members[pname].wC.length;
		members[pname].wC = members[pname].wC.filter(function(t)
		{
			var rt = true;
			wh.forEach(function(dW){
				if(dW.text[0] == t.text[0])rt = false;
			});
			return rt;
		});
		if(members[pname].wC.length + wh.length != inil){cheatDetected();return;}
		roundCards[pname] = wh;
		emit("cardPlayed", roundCards);
		if(Object.keys(roundCards).length >= Object.keys(members).length -1)cze();
	}
	
	var czarTime = false;
	
	function cze()
	{
		czarTime = true;
		clearTimeout(timer);
		timer = setTimeout(noTime, 120000);
		emit("setTimer", 120);
		emit("czarTime", roundCards);
	}
	
	function czer(n, pname)
	{
		if(pname!=czar||Object.keys(roundCards).length < Object.keys(members).length -1)return;
		members[n].sc++;
		emit('memberinfo', members);
		emit("czd", n);
		emit("chat", "SERVER", str.game.win.replace('{p}', n));
		clearTimeout(timer);
		emit("setTimer", 0);
		setTimeout(nextRound, 5000);
	}
	
	function cheatDetected()
	{
		console.log('chiter!!!');
		// TODO: kick/ban the user
	}
}