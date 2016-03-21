/**
 * BlankCards Main Server
 * ©2016 thebit.link
 */
'use strict';

const serverSecurity = require('./serverSecurity.js');
const strings = require('./strings.js');
const Chat    = require('./chat.js');
const Globals = require('./globals.js');
const settings = Globals.serverSettings;

module.exports = server =>
{
    // Temporary: Add a placeholder "room" for the lobby.
    Globals.Rooms = {lobby:{name: 'lobby', priv: true, desc:'Welcome to Blank Cards!',Players:[]}};
    // Hook socket.io to the express server
    const io = require('socket.io')(server);
    Globals.io = io;
    
    io.on('error', err =>
    {
        console.error(err);
    });
    
    io.on('connection', socket =>
    {
        // The player enters an username
        socket.on('login', userName =>
        {
            // Security check
            userName = userName.trim();
            // The name is reserved or forbidden
            if (userName.length < 1 || serverSecurity.forbiddenNames.indexOf(userName.toLowerCase()) !== -1)
            {
                socket.emit('login fail', strings.server.errors.forbiddenname, true, userName);
                return;
            }
            // The IP address of the player is banned
            else if (serverSecurity.globalBanned.indexOf(socket.handshake.address) !== -1)
            {
                socket.emit('login fail', strings.server.errors.globalbanned, false);
                return;
            }
            // The username is already in use.
            else if (Object.keys(Globals.Players).indexOf(userName) !== -1)
            {
                socket.emit('login fail', strings.server.errors.inuse, true, userName);
                return;
            }
            
            // Player Object
            var player = {name: userName, socket: socket, room: 'lobby'};
            socket.join('lobby');
            
            Globals.Players[userName] = player;
            Globals.Rooms.lobby.Players.push(player.name);
            player.chat = new Chat(player);
            require('./rooms.js')(player, Globals.Players, Globals.Rooms);
            socket.on('disconnect', function()
            {
                try
                {
                    var index = Globals.Rooms[Globals.Players[userName].room].Players.indexOf(userName);
                    if (index !== -1)
                    {
                        delete Globals.Rooms[Globals.Players[userName].room].Players[index];
                    }
                    delete Globals.Players[d];
                }
                catch (e)
                {       
                }
            });
            socket.emit('login success', userName);
            socket.emit('roomlist_res', Globals.Rooms);
        });
    });
    
    // Watch Rooms for changes
    Object.observe(Globals.Rooms, function()
    {
        io.emit('roomlist_res', Globals.Rooms);
    });
    
    Object.observe(Globals.Players, function()
    {
        io.emit('playercount', Object.keys(Globals.Players).length);
    });
    
    return io;
};
