/**
 * BlankCards Chat Module
 * ©2016 thebit.link
 * 
 * This class attachs to every player once joined.
 */
'use strict';

const Globals = require('./globals.js');
const strings  = require('./strings.js');

class Chat
{
    constructor(player)
    {
        const chat = this;
        this.player = player;
        this.socket = player.socket;
        
        // Send a welcome message and bind default commands
        this.sendMessage(Globals.serverSettings.chatWelcome);
        this.bindDefaultCommands();
        
        // The Player sends a chat Message
        player.socket.on('chat', message=>
        {
            chat.publicMessage(message);
        });
        
        // The player sends a chat command
        player.socket.on('chatcommand', data=>
        {
            var command = data.split(' ');
            chat.executeCommand(command.shift(), command);
        });
    }
    
    // Send a chat message from the player to all members of the same room
    publicMessage(message, name)
    {
        name = name||this.player.name;
        Globals.io.to(this.player.room).emit('chat', name, message);
        console.log(`[#${this.player.room}] ${this.player.name}: ${message}`);
    }
    
    // Send a message from the server to the player
    sendMessage(message)
    {
        this.player.socket.emit('chat', 'SERVER', message);
    }
    
    // Send a message as BlankCards to to the members of the room
    sendAnnouncement(message, asServer)
    {
        this.publicMessage(message, asServer ? 'SERVER':'BlankCards');
    }
    
    // Execute a chat command sent by the player
    executeCommand(command, args)
    {
        try
        {
            this.commands[command].apply(this, args);
        }
        catch (ex)
        {
            console.error(ex);
            this.sendMessage(strings.chat.commandnotfound);
        }
    }
    
    // Bind default commands
    bindDefaultCommands()
    {
        this.commands = {
            // Help command
            help()
            {
                let response = '';
                strings.chat.commandlist.forEach(el=>
                {
                    response += el + '\n';
                });
                this.sendMessage(response);
            },
            // Roll a dice with a random number between 0 and [max]
            roll(max)
            {
                let maxNumber = parseInt(max)||99;
                if (maxNumber < 1000)
                {
                    let response = Math.floor(Math.random() * (maxNumber - 0 + 1)) + 0;
                    let rstring  = strings.buildString(strings.chat.roll, {p: this.player.name, n1: response, n2: maxNumber});
                    this.sendAnnouncement(rstring);
                }
                else
                {
                    this.sendMessage(strings.chat.roll2big);
                }
            },
            // The classic /me command
            me()
            {
                let response = Array.prototype.slice.call(arguments).join(' ');
                this.sendAnnouncement(`*${this.player.name}* ${response}`, true);
            },
            // Clear the chat log
            clear()
            {
                this.socket.emit('chatmeta', 'clear');
            },
            // Display server related information
            info()
            {
                let response = ["*BlankCards* v0.2a", "by:thebit.link","", Globals.serverSettings.serverName + "~("+Globals.serverSettings.serverLocale+")~"];
                response.push(Globals.serverSettings.additionalInfo);
                response.push('');
                response.push(strings.server.translationcredits);
                this.sendMessage(response.join('\n'));
            },
            // Private Messages
            pm(player)
            {
                const args = Array.prototype.slice.call(arguments);
                args.shift();
                
                let message = args.join(' ');
                try
                {
                    Globals.Players[player].socket.emit('chat', this.player.name + '<-[PM]', message);
                    this.player.socket.emit('chat', player + '->[PM]', message);
                }
                catch (ex)
                {
                    this.sendMessage(strings.chat.couldntsendpm);
                }
            }
        };
    }
    
    bindCommand(commandName, command)
    {
        if (commandName && typeof commandName == 'string' && typeof command == 'function')
        {
            this.commands[commandName] = command;
        }
    }
    
    unbindCommand(commandName)
    {
        delete this.commands[commandName];
    }
}

module.exports = Chat;
