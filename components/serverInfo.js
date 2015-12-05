var fs = require('fs');
var bcs = fs.readFileSync("BlankCards.json");
module.exports = JSON.parse(bcs);