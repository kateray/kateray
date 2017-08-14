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

var url = 'https://spreadsheets.google.com/feeds/list/1XWRuM1aIEYXyqw4JMdQrDkpoppXPcIPE58vKqbeOjBE/od6/public/values?alt=json'
https.get(url, res => {
  res.setEncoding("utf8");
  var responseData = "";
  res.on("data", data => {
    responseData += data;
  });
  res.on("end", () => {
    var respData = []
    responseData = JSON.parse(responseData)['feed']['entry'];
    responseData.forEach( (d) => {
      var r = {}
      r['id'] = d['gsx$id']['$t']
      r['text'] = d['gsx$text']['$t']
      r['type'] = d['gsx$type']['$t']
      r['href'] = d['gsx$href']['$t']
      r['startyear'] = d['gsx$startyear']['$t']
      r['endyear'] = d['gsx$endyear']['$t']
      r['inactive'] = d['gsx$inactive']['$t']
      r['explanation'] = d['gsx$explanation']['$t']
      r['links'] = d['gsx$links']['$t']
      respData.push(r)
    })
    fs.writeFile("data.json", JSON.stringify(respData), function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    });
  });
})

app.get("/data.json", function(req, res) {
  var data = getConfig('data.json')
  res.send(data);
})
var port = process.env.PORT || 3000;

var server = app.listen(port);
