const app = require('./app')

app.listen((process.env.PORT || 3000), () => {
  console.log('App listening on port 3000!')
})
