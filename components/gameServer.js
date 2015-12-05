var Players = {}
var Rooms = {lobby:{name: 'lobby', priv: true, desc:'Welcome to Blank Cards!',Players:[]}};
var serverSecurity = require('./serverSecurity.js');
var sett = require('./serverInfo.js');
var str = require('./strings.js');

module.exports = function(server)
{
	var io = require('socket.io')(server);
	
	io.on('error', function(err){
		console.log(err);
	});
	
	io.on('connection', function (socket) {
		socket.on('login', function(d)
			{
				// Security check
				d = d.trim();
				if(d.length < 1)
				{
					socket.emit('login fail', str.server.errors.forbiddenname, true, d);
					return;
				}
				if(serverSecurity.forbiddenNames.indexOf(d.toLowerCase()) != -1){
					socket.emit('login fail', str.server.errors.forbiddenname, true, d);
					return;
				}
				if(serverSecurity.globalBanned.indexOf(socket.handshake.address) != -1)
				{
					socket.emit('login fail', str.server.errors.globalbanned, false);
					return;
				}
				// Duplicate check
				if(Object.keys(Players).indexOf(d) != -1)
				{
					socket.emit('login fail', str.server.errors.inuse, true, d);
					return;
				}
				var p = {name: d, socket: socket, room: 'lobby'}
				Players[d] = p;
				Rooms.lobby.Players.push(p.name);
				require('./chat.js')(p, Players, Rooms);
				require('./rooms.js')(p, Players, Rooms);
				socket.on('disconnect', function()
				{
					try{
						var index = Rooms[Players[d].room].Players.indexOf(d);
					    if (index !== -1) {
						    delete Rooms[Players[d].room].Players[index];
				    	}
				    	delete Players[d];
					}
					catch(e)
					{
						
					}
				});
				socket.emit('login success', d);
				socket.emit('roomlist_res', Rooms);
			});
	});
	
	// Watch Rooms for changes
	Object.observe(Rooms, function(c)
	{
		io.emit('roomlist_res', Rooms);
	});
	
	Object.observe(Players, function(c)
	{
		io.emit('playercount', Object.keys(Players).length);
	});
	
	return io;
}