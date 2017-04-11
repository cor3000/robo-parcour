const express = require('express');
const helmet = require('helmet');
const app = express();

const expressWs = require('express-ws')(app);

//security recommended stuff
app.disable('x-powered-by')
app.use(helmet())

//static resources
app.use('/static', express.static('public'))

//enable websocket
app.ws('/ws', function(ws, req) {
  ws.on('message', function(msg) {
    console.log(msg);
  });
  console.log('socket', req);
  console.log('ws', ws);
});


app.listen(8000, function () {
  console.log('Example app listening on port 8000!');
});

