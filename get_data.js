var fs = require("fs");
var https = require('https');

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
