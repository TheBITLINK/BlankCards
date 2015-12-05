var express = require('express');
var router = express.Router();
var serverInfo = require('../components/serverInfo.js');
var strings = require('../components/strings.js');
var exec = require('child_process').exec;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { server: serverInfo, s: strings });
});

router.get('/r/:room', function(req,res, next){
  res.render('index', { room: req.params.room , server: serverInfo, s: strings });
});

router.get('/BlankCards.json', function(req, res, next)
{
  res.jsonp(serverInfo);
});

// I know this isn't the best way but fuck it, i'm drunk!
router.get('/sys/update', function(req, res, next)
{
  //update password
  var pass = "haxx";
  if(req.query["pass"] != pass){res.end('GTFO');return;}
  res.contentType("text/plain");
		console.log("GIT PULL HAS BEGUN :^)");
		exec('git pull origin master',
		function (error, stdout, stderr) {
			console.log('stdout: ' + stdout);
			console.log('stderr: ' + stderr);
			if (error !== null) {
				res.send('\n\n' + error)
			}
			res.end('\n' + stdout + '\n' + stderr + '\n\n\nRestarting in 5 seconds...');
			console.log('\n\n\nRestarting in 5 seconds...');
			setTimeout(function(){process.exit();}, 5000);
		});
});

module.exports = router;
