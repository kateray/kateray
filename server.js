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
app.listen(3000);
console.log('Listening on port 3000');