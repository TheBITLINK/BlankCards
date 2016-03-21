var serverSecurity = require('./serverSecurity.js');
var str = require('./strings.js');

module.exports = function(p, players, rooms)
{
	p.socket.on('createroom', function(d, o)
	{
		if(serverSecurity.forbiddenRooms.indexOf(d.toLowerCase()) > -1||d.trim() == '')
		{
			p.socket.emit("joinerror", false, str.room.forbiddenname);
			return;
		}
		if(typeof rooms[d] == 'undefined')
		{
			rooms[d] = {
				name: d,
				Players: [p.name],
				priv: false,
				password: '',
			}
			for(var key in o)
			{
				rooms[d][key] = o[key];
			}
			// Remove them from previous room
			var index = rooms[p.room].Players.indexOf(p.name);
            p.socket.leave(p.room);
			if (index !== -1) {
				 rooms[p.room].Players.splice(index, 1);
			}
			p.room = d;
            p.socket.join(p.room);
			p.socket.emit('chatmeta', 'clear');
			require('./game.js')(p, players, rooms, d);
		}
		else
		{
			p.socket.emit("joinerror", false, str.room.alreadyexist);
		}
	});
	
	p.socket.on('joinroom', function(nm, pass){
		if(typeof rooms[nm] == 'undefined')
		{
			p.socket.emit("joinerror", true, str.room.notexist);
			return;
		}
		if(rooms[nm].password != '')
		{
			if(typeof pass == 'undefined' || pass == '')
			{
				p.socket.emit('roomauth', true, nm);
				return;
			}
			else
			{
				if(pass != rooms[nm].password){
					p.socket.emit('roomauth', false, nm);
					return;
				}
			}
		}
		if(rooms[nm].Players.length >= 12){
			p.socket.emit("joinerror", false, str.room.full);
		}
		rooms[nm].Players.push(p.name);		
		// Remove them from previous room
		var index = rooms[p.room].Players.indexOf(p.name);
        p.socket.leave(p.room);
		if (index !== -1) {
			 rooms[p.room].Players.splice(index, 1);
		}
		p.room = nm;
        p.socket.join(p.room);
		p.socket.emit("joinroom", rooms[nm]);
		p.socket.emit('chatmeta', 'clear');
	});
	
	p.socket.on('roomlist_rq', function(){
		p.socket.emit('roomlist_res', rooms);
	})
}