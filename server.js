var fs = require("fs"),
    json;
var https = require('https');

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

var airbrake = require('airbrake').createClient(
  '140494', // Project ID
  'b57e26447f79beb22986db6be6ee6c04' // Project key
);
airbrake.handleExceptions();

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

app.get("/data", function(req, res) {
  var url = 'https://spreadsheets.google.com/feeds/list/1XWRuM1aIEYXyqw4JMdQrDkpoppXPcIPE58vKqbeOjBE/od6/public/values?alt=json'
  console.log('um')
  https.get(url, res => {
    console.log(res)
    res.setEncoding("utf8");
    let body = "";
    res.on("data", data => {
      body += data;
    });
    res.on("end", () => {
      body = JSON.parse(body);
      res.send(body)
    });
  });
})
var port = process.env.PORT || 3000;

var server = app.listen(port);
