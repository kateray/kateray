var fs = require("fs"),
    json;

function readJsonFileSync(filepath, encoding){

    if (typeof (encoding) == 'undefined'){
        encoding = 'utf8';
    }
    var file = fs.readFileSync(filepath, encoding);
    return JSON.parse(file);
}

function getConfig(file){

    var filepath = __dirname + '/' + file;
    return readJsonFileSync(filepath);
}

var data = getConfig('data.json')
var express = require('express');
var app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(require('connect-assets')());
app.use(express.static(__dirname + '/public'));
app.get("/", function(req, res) {
  return res.render('home', {
    title: 'Home'
  });
});
app.get("/joining-experiment", function(req, res) {
  return res.render('experiment', {
    title: 'Joining Experiment'
  });
});
app.get("/data.json", function(req, res) {
  res.send(data);
})
var port = process.env.PORT || 3000;

var server = app.listen(port);
