const Express = require('express')
const path = require('path')
const fs = require('fs')
const manifestPath = `${process.cwd()}/dist/build-manifest.json`
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const env = process.env.NODE_ENV || 'development';

function readJsonFileSync(filepath, encoding){
  if (typeof (encoding) == 'undefined'){
      encoding = 'utf8'
  }
  var file = fs.readFileSync(filepath, encoding)
  return JSON.parse(file)
}

function getConfig(file){
  var filepath = __dirname + '/' + file
  return readJsonFileSync(filepath)
}

const app = Express()

if (env === 'production') {
  const airbrake = require('airbrake').createClient(
    '140494', // Project ID
    'b57e26447f79beb22986db6be6ee6c04' // Project key
  );
  airbrake.handleExceptions()
}

app.use(Express.static('public'))
app.use('/dist', Express.static('dist'))

app.get('/joining-experiment', (req, res) => {
  const jsLink = manifest['main.js']
  const cssLink = manifest['main.css']
  fs.readFile(path.join(__dirname, '../../client/blog.html'), 'utf8', (err, htmlData) => {
    if (err) {
      console.error('read err', err)
      return res.status(404).end()
    }
    const RenderedApp = htmlData
      .replace('{{JS}}', `/dist/${jsLink}`)
      .replace('{{CSS}}', `/dist/${cssLink}`)
    res.send(RenderedApp)
  })
})

app.get("/data.json", function(req, res) {
  var data = getConfig('../../data.json')
  res.send(data);
})

app.get('*', (req, res) => {
  const jsLink = manifest['main.js']
  const cssLink = manifest['main.css']
  fs.readFile(path.join(__dirname, '../../client/index.html'), 'utf8', (err, htmlData) => {
    if (err) {
      console.error('read err', err)
      return res.status(404).end()
    }
    const RenderedApp = htmlData
      .replace('{{JS}}', `/dist/${jsLink}`)
      .replace('{{CSS}}', `/dist/${cssLink}`)
    res.send(RenderedApp)
  })
})

module.exports = app
