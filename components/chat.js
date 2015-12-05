var sett = require('./serverInfo.js');
var str = require('./strings.js');

module.exports = function(p, players, rooms)
{
	p.socket.emit('chat', "SERVER", sett.chatWelcome);
	
	function publicMsg(d, n){
		    if(typeof n == "undefined"){n=p.name}
			rooms[p.room].Players.forEach(function(v, i)
				{
					var c = players[v];
					c.socket.emit('chat', n, d);
				});
			console.log('[#'+p.room+'] ' + n +': ' + d);
		}
	
	p.socket.on('chat', function(d)
	{
		publicMsg(d);
	});
		
	p.socket.on('chatcommand', function (d) {
		var c = d.split(' ');
		try { chatCommands[c[0]](c); }
		catch(e) {
			p.socket.emit('chat', 'SERVER', str.chat.commandnotfound);
		}
	});
	
	var chatCommands = {
		help: function(a)
		{
			var rt = "";
			str.chat.commandlist.forEach(function(el) {
				rt += el + "\n";
			});
			p.socket.emit('chat', 'SERVER',rt);
		},
		roll: function(a)
		{
			var num = a[1];
			if(num>1000){p.socket.emit('chat', 'SERVER', str.chat.roll2big);return;}
			var res = Math.floor(Math.random() * (num - 0 + 1)) + 0;
			
			publicMsg(str.chat.roll.replace('{p}', p.name).replace('{n1}', res).replace('{n2}', num), sett.chatBotName);
		},
		me: function(a)
		{
			a.shift();
			publicMsg('*'+p.name+'* '+a.join(' '), 'SERVER');
		},
		clear: function(a)
		{
			p.socket.emit('chatmeta', 'clear');
		},
		info: function(a)
		{
			var sinfo = ["*BlankCards* v0.1a", "by:thebit.link","",sett.serverName + "~("+sett.serverLocale+")~"];
			sinfo.push(sett.additionalInfo);
			sinfo.push("");
			sinfo.push(str.server.translationcredits);
			p.socket.emit('chat', 'SERVER', sinfo.join("\n"));
		}
	}
}