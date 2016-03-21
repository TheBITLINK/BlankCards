var socket = io();

// Haxx
window.onbeforeunload = function()
{
    socket.disconnect();
};

/* Modal UI */

var ModalUI = {
  prompt: function(msg, callback, placeholder, ispass, def)
  {
    var cfd = $('#prompt');
    cfd.find('.header').html(msg);
    cfd.find('input').prop('placeholder', (typeof(placeholder) != 'undefined') ? placeholder : str.shared.entertext);
    cfd.find('input').val((typeof(def) != 'undefined')? def : '');
    cfd.find('input').prop('type', ispass?"password":"text")
    cfd.find('input').focus();
    cfd.modal({ closable:false, onApprove: function(e){
      try{
        callback(true, cfd.find('input').val());
      }catch(e){}
    }, onDeny: function(e){
      try{
        callback(false, cfd.find('input').val());
      }catch(e){}
    } });
    cfd.modal('show');
  },
  confirm: function(msg, callback, header)
  {
    var cfd = $('#confirm');
    cfd.find('.description').html(msg);
    cfd.find('.header').html((typeof(header) != 'undefined') ? header : str.shared.confirmation);
    cfd.modal({closable:false, onApprove: function(e){
      try{
        callback(true);
      }catch(e){}
    }, onDeny: function(e){
      try{
        callback(false);
      }catch(e){}
    } });
    cfd.modal('show');
  },
  alert: function(msg, callback, header)
  {
    var cfd = $('#alert');
    cfd.find('.description').html(msg);
    cfd.find('.header').html((typeof(header) != 'undefined') ? header : str.shared.alert);
    cfd.modal({ onHide: function(e){
      try{
        callback();
      }catch(e){}
    }});
    cfd.modal('show');
  }
}

  // Read User Data from localStorage
  var userData = localStorage.userData ? JSON.parse(localStorage.userData) : {_uid: '.'};
  

$(function(r){

  /* Login */
  
  if(typeof sessionStorage["username"] != 'undefined')
  {
    var n = sessionStorage["username"];
    socket.emit('login', n, userData._uid);
  }
  else
  {
    ModalUI.prompt(str.server.login, function(a, n)
  {
    if(a)
    {
      socket.emit('login', n, userData._uid);
    }
    else
    {
      window.location.reload();
    }
  }); 
  }
  
  /* Room Change */
  $("a[rel='room']").click(RoomLink);
  
  $(window).bind('popstate', function() {
    //$.ajax({url:location.pathname+'?rel=tab',success: function(data){
    //$('#content').html(data);
  });
  
  /* Deck manager */
  var c = []
  srv.availDeck.forEach(function(el){
    c.push({title:el})
  });
  $('#ssCards').search({source:c});
  $('#sCards').keypress(function(e)
  {
    if(e.which != 13)return;
    var v = $('#sCards').val().trim();
    if(v.startsWith("CC:")&&v.length == 8)
    {
      selDeck.push(v);
      RDRL();
      $('#sCards').val('');
    }
    else if(srv.availDeck.indexOf(v) != -1)
    {
      selDeck.push(v);
      RDRL();
    }
      $('#sCards').val('');
  });
});

var username = '';

socket.on('login success', function(n, uid)
{
  sessionStorage["username"] = n;
  userData._uid = uid;
  localStorage.userData = JSON.stringify(userData);
  username = n;
  onLobby = true;
  $('#chatSend').click(chatSend);
  CheckRoom();
  if(typeof localStorage["blockedusers"] != "undefined")
  {
    chatMeta.blocked = JSON.parse(localStorage["blockedusers"]);
  }
  $('#userPrefs').html(username+'&nbsp;<i class="icon settings"></i>&nbsp;').click(UserPrefs);
  $('#newRoom').click(NewRoom);
});

socket.on('login fail', function(err, rl,nm){
  if(!rl)
  {
    ModalUI.alert(err, function(){window.close()}, "Error");
    return;
  }
  ModalUI.prompt(err, function(a, n)
  {
    if(a)
    {
      socket.emit('login', n);
    }
    else
    {
      window.location.reload();
    }
  },'', false, nm);
});

/* Chat */
function chatMarkup(text) {
    text = text.replace(/\*(.*?)\*/g, "<b>$1</b>");
    text = text.replace(/_(.*?)_/g, "<u>$1</u>");
    text = text.replace(/~(.*?)~/g, "<i>$1</i>");
    text = text.replace(/-(.*?)-/g, "<del>$1</del>");
    text = text.replace(/(?:\r\n|\r|\n)/g, '<br/>');
    return text;
}

var chatMeta = {
  admins: ["admin"],
  mods: ["Blank Cards"],
  blocked: []
}

function chatColor(name)
{
  var hash = 0;
  for (var i = 0; i < name.length; i++) {
     hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  var c = (hash & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();

    return "00000".substring(0, 6 - c.length) + c;
}

socket.on('chatmeta', function(a)
{
  if(a == 'clear')
  {
    $('#chatMsg').html('');
  }
});

socket.on('chat', function(n, msg)
{
  if(chatMeta.blocked.indexOf(n) != -1) return;
  if(n == "SERVER")
  {
    $('#chatMsg').append('<div class="item"><center>'+ chatMarkup(msg) +'</center></div>');
  }
  else
  {
    var msgEl = $('<div class="item"><b style="color:#'+chatColor(n)+'">'+n+'</b>: '+ chatMarkup($('<span>'+msg+'</span>').text()) +'</div>');
    if(chatMeta.admins.indexOf(n) != -1)msgEl.toggleClass("adminmsg");
    if(chatMeta.mods.indexOf(n) != -1)msgEl.toggleClass("modmsg");
    $('#chatMsg').append(msgEl);
    if($('<span>'+msg+'</span>').is(":contains('"+username+"')"))
    {
      msgEl.toggleClass('mentionmsg');
    }
  }
  $('#chatSegment').scrollTop($('#chatSegment')[0].scrollHeight);
});

function chatSend(){
		var message = $('#chatInput').val(); 
		if(message == ""){return;}
    if(message.substr(0,1)=="/")
    {
      socket.emit('chatcommand', message.substr(1));
    }
    else
    {
      socket.emit('chat', message);
    }
		$('#chatInput').val('');
	}

$(document).keypress(function(e) {
    if(e.which == 13) {
      chatSend();
    }});
    
/** Lobby **/

var onLobby = false;

socket.on('roomlist_res', function(rooms)
{
  if(!onLobby||searching)return;
  $('#roomlist').html('');
  var roomlist = Object.keys(rooms);
  $('#roomCount').html(roomlist.length -1);
  roomlist.forEach(function(roomkey, i)
  {
    var room = rooms[roomkey];
    if(room.priv){return;}
    var roomEl = $('<a class="ui card" rel="room" href="/r/'+ room.name +'"></a>');
    // Main Content
    var rElc = $('<div class="content"></div>');
      rElc.append('<div class="header">#'+room.name+'</div>');
      if(typeof room.desc != 'undefined')rElc.append('<div class="meta">'+room.desc+'</div>');
    roomEl.append(rElc);
    // Extra content
    var rExc = $('<div class="extra content"></div>');
      rExc.append('<i class="icon user"></i> ' + room.Players.length);
      (room.password!='')?rExc.append('&nbsp;<i class="icon lock"></i>'):'';
    roomEl.append(rExc);
    
    roomEl.appendTo('#roomlist');
  });
  $("a[rel='room']").click(RoomLink);
});

socket.on('playercount', function(count)
{
  $('#playerCount').html(count);
});

var searching;

function LobbySearch()
{
  var sVal = $('#searchRooms').val().trim();
  if(sVal == '')
  {
    $(".ui.card[rel='room']").show();
    searching = false;
    return;
  }
  else
  {
    $(".ui.card[rel='room']").hide();
    $(".ui.card[rel='room'][href*='"+ sVal +"']").show();
    searching = true;
  }
}

/** Room Handling **/

function RoomLink(e){
    //e.preventDefault();
    var pageurl = $(this).attr('href');
    if(pageurl!=window.location.href){
      window.history.pushState({path:pageurl},'',pageurl);
    }
    CheckRoom();
    return false;
  }

function CheckRoom()
{
  var m = document.location.pathname.split('/');
  if(m[1] == 'r')
  {
    if(m[2] == 'lobby'){
      onLobby = true;
      window.history.replaceState({path:'/'},'','/');
      $('#lobby').show();
      $('#game').hide();
      return;
    }
  }
  if(m[2] != null)
  {
    $('#loadState').addClass('active');
    socket.emit('joinroom', m[2]);
  }
}

function NewRoom()
{
  var cfd = $('#newroom');
    cfd.find('#newroom_name').focus();
    selDeck = srv.defdeck;
    RDRL();
    cfd.modal({onApprove: function(e){
      var RoomName = cfd.find('#newroom_name').val().split(' ').join('').substr(0, 32);
      var RoomDesc = cfd.find('#newroom_desc').val().substr(0, 96);
      var RoomPass = cfd.find('#newroom_pass').val();
      var RoomPriv = (cfd.find('#newroom_priv').val() == "priv");
      socket.emit('createroom', RoomName, {'desc': RoomDesc, 'priv': RoomPriv, 'password': RoomPass, 'decks': selDeck});
      $('#loadState').addClass('active');
    }});
    cfd.modal('show');
    $('.menu .item').tab();
  return false;
}

var selDeck = []

function RDRL()
{
  $('#seldeck').html('');
  selDeck.forEach(function(e){
    var i = $('<div class="ui item"></div>');
    // CardCast Deck
    if(e.startsWith("CC:")){
      var ccid = e.split(":")[1];
      var eln = $('<div class="middle aligned content">CardCast Deck</div>');
      i.append('<a href="https://www.cardcastgame.com/browse/deck/'+ccid+'" class="ui teal label icon"><i class="icon feed"></i> '+ccid+'</a>');
      eln.appendTo(i);
    }
    // Standard deck
    else
    {
      i.append('<div class="middle aligned content">'+e+'</div>');
    }
    var delbtn = $('<button class="ui right floated icon mini button"><i class="icon delete"></i></button>');
    delbtn.appendTo(i);
    delbtn.click(function(l){selDeck.splice(selDeck.indexOf(e), 1);RDRL();});
    i.appendTo("#seldeck");
  });
}

var onRoom = false;

socket.on('joinerror', function(aC, msg)
{
  var m = document.location.pathname.split('/');
  $('#loadState').removeClass('active');
  var Modal = aC ? ModalUI.confirm : ModalUI.alert;
  Modal(msg, function(e)
  {
    if(e)
    {
      NewRoom();
      $('#newroom_name').val(m[2]);
    }
    window.history.replaceState({path:'/'},'','/');
  }, "Error");
});

socket.on('roomauth', function(ft, rn){
  var m = ft?str.room.password:str.room.incpassword;
  $('#loadState').removeClass('active');
  ModalUI.prompt(m, function(r, d){
    if(!d){
      window.history.replaceState({path:'/'},'','/');
      return;
    }
    socket.emit("joinroom", rn, d);
    $('#loadState').addClass('active');
  }, "", true);
});

socket.on('joinroom', function(nm)
{
  document.title = "#"+ nm.name;
  onLobby = false;
  onRoom = true;
  $('#lobby').hide();
  $('#game').show();
  $('#loadState').removeClass('active');
  window.history.replaceState({path:'/r/'+nm.name},'','/r/'+nm.name);
  $('#hText').text('#'+nm.name);
  $('#hDesc').text(nm.desc);
  $('#chat').addClass('bc-playerlist');
});

/** User preferences **/
function UserPrefs()
{
  var cfd = $('#userprefs');
    cfd.find('#usrnch').val(username);
    chatMeta.blocked.forEach(function(el,i)
    {
      cfd.find('#userlck').val(cfd.find('#userlck').val()+(i==0?'':', ')+el);
    });
    cfd.modal({onApprove: function(e){
      chatMeta.blocked = [];
      var lcu = cfd.find('#userlck').val().split(',');
      lcu.forEach(function(el, i)
      {
        chatMeta.blocked.push(el.trim());
      });
      localStorage["blockedusers"] = JSON.stringify(chatMeta.blocked);
      if(cfd.find('#usrnch').val() != username)
      {
        sessionStorage["username"] = cfd.find('#usrnch').val();
        window.location.reload();
      }
    }});
    cfd.modal('show');
  return false;
}

/** Game **/

socket.on("memberinfo", function(members){
  $('#plSegment').html('');
  var ee = Object.keys(members);
  ee.forEach(function(r){
    $('#plSegment').append('<div data-member="'+r+'" class="item '+ (czar==r?'bc-czar':'') +'"><span style="background: #'+chatColor(r)+';'
    +' width: 8px; height: 8px; border-radius: 100%; margin-right: 4px;margin-bottom: 1px; display: inline-block;"></span>'
    +'<span>'+r+'</span><span style="float:right;">'+members[r].sc+'</span><br/>');
  });
  $('#rplayerCount').html(ee.length);
});

var czar = "";

socket.on("nextRound", function(meta){
  tG = [];
  $('#bCcont').html('');$('#wCcont').html('');$('#playedCards').html('');
  $('#wcs').dimmer('hide');
  czar = meta.czar;
  czd = false;
  // Get Black Card
  $('.bc-czar').removeClass('bc-czar');
  $('[data-member="'+czar+'"]').addClass('bc-czar');
  bC = meta.blackCard;
  var bcard = $('<div class="ui card bc-blackcard" style="background-color: black!important;height: 256px!important;word-wrap:break-word;overflow:hidden!important;width: 256px!important;">'
  +'<div class="content"><div class="header" style="color:white!important;">'
  +meta.blackCard.text.join(' _______ ')
  +'</div></div><div class="extra content" style="color:#666;">'
  + '<i class="icon columns"></i> Blank Cards'
  + (meta.blackCard.text.length > 2 ? ('<span style="float:right">Pick '+ (meta.blackCard.text.length -1) + '</span>') : '')  
  +'</div></div>');
  bcard.appendTo('#bCcont');
  // Get White Cards
  var wcards = $('<div class="ui cards"></div>');
  meta.members[username].wC.forEach(function(wc)
  {
    wcards.append('<div class="ui card bc-whitecard" data-wc=\''+ JSON.stringify(wc).replace("'", "&#39;") +'\' style="width: 128px; word-wrap: break-word; height: 128px; overflow: hidden;"><div class="content">'+wc.text[0]+'</div></div>');
  });
  wcards.appendTo('#wCcont');
  if(meta.czar == username)
  {
    $('#wcs').dimmer('show');
  }
  else
  {
    $('.bc-whitecard').click(whiteCardH);
  }
});

var timerInterval;
var timer;

socket.on('setTimer', function(t){
  clearInterval(timerInterval);
  timer = t;
  (t > 0) ? $('#timerCount, #timerLabel').show() : $('#timerCount, #timerLabel').hide();
  $('#timerCount').html(t);
  timerInterval = setInterval(function(){
    if(timer > 1)$('#timerCount').html(--timer);
    else{clearInterval(timerInterval);$('#timerCount').hide();}
  }, 1000);
});

var tG = [];
var bC;

function whiteCardH(e)
{
  var el = $(e.currentTarget);
  if(el.hasClass('bc-sel')|| tG.length >= bC.text.length -1)return;
  if(!el.hasClass('bc-presel'))
  {
    $('.bc-whitecard').removeClass('bc-presel');
    el.addClass('bc-presel');
  }
  else
  {
    $('.bc-whitecard').removeClass('bc-presel');
    el.addClass('bc-sel');
    tG.push(JSON.parse(el[0].dataset["wc"]));
    if(tG.length >= bC.text.length -1)
    {
      socket.emit("playCards", tG);
    }
  }
}

socket.on("cardPlayed", function(ca){
  var ky = Object.keys(ca);
  $("#playedCards").html('');
  ky.forEach(function(rds)
  {
    var cg = $('<div class="mini-card-group"></div>');
    var cards = ca[rds]; // heh
    cards.forEach(function(card){
      cg.append('<div class="mini-card"></div>');
    });
    cg.appendTo("#playedCards");
  });
});

socket.on("czarTime", function(ca)
{
  var ky = Object.keys(ca);
  $("#playedCards").html('');
  ky.forEach(function(rds)
  {
    var cg = $('<div data-by="'+ rds +'" class="mini-card-group"></div>');
    var cards = ca[rds]; // heh
    cards.forEach(function(card){
      cg.append('<div class="mini-card">'+card.text[0]+'</div>');
    });
    cg.appendTo("#playedCards");
  });
  if(czar == username)
  {
    $('.mini-card-group').click(cze);
  }
});

var czd = false;

function cze(e)
{
  var el = $(e.currentTarget);
  if(el.hasClass('bc-sel') || czd)return;
  if(!el.hasClass('bc-presel'))
  {
    $('.mini-card-group').removeClass('bc-presel');
    el.addClass('bc-presel');
  }
  else
  {
    $('.mini-card-group').removeClass('bc-presel');
    el.addClass('bc-sel');
    socket.emit("cze", el[0].dataset.by);
  }
}

socket.on("czd", function(e){
  $('[data-by="'+e+'"]').addClass("bc-sel");
});

// THE WAITING ROOM
socket.on("waitforplayers", function(mn){
  $('#waitLink').val('(...)');
  genLink();
  $('#wfp, #wf2, #wf3, #wf4').hide();
  if(mn){
    $('#wfp').html(str.waiting.joinnext).show();
    $('#wf2').html(str.waiting.spectnotsupported).show();
  }
  else
  {
    $('#wfp').html(str.waiting.waitingforplayers).show();
    $('#wf2').html(str.waiting.youneed3).show();
    $('#wf3').html(str.waiting.waitorshare).show();
    $('#wf4').show();
  }
  $('#waitLink').off('click').on('click', function(e){
    $('#waitLink').select();
  });
  $('#waitCopy').off("click").click(copyLink);
  $('#game').addClass('waiting');
});

// You can override this function for custom link generation (for example, an url shortner)
function genLink()
{
  $('#waitLink').val(document.location.href);
}

function copyLink()
{
  // HAI
  // OBTW This copies the link to the clipboard on some modern browsers
  // CAN HAS COPY?
  var copySupported = document.queryCommandSupported('copy');
  // O RLY?
  if(copySupported)
  {
    // YA RLY
    $('#waitLink').select();
    // PLZ COPY LINK
    if(document.execCommand('copy'))
    {
      // AWSUM THX
    }
    else
    {
      // O NOES
      manualCopy();
    }
  }
  else
  {
    // NO WAI
    manualCopy();
  }
  // KTHXBYE
}

function manualCopy()
{
  ModalUI.alert("Copying is not supported in your browser, copy the link manually instead.");
}

socket.on("win", function(n){
  ModalUI.alert(str.game.winner.replace("{p}", n), function(){document.location.href = '/'}, str.game.over);
})

socket.on("stopwaiting", function(){
  $('#game').removeClass('waiting');
});