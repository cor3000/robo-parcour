const express = require('express');
const helmet = require('helmet');
const app = express();
const localtunnel = require('localtunnel');

const expressWs = require('express-ws')(app);

//security recommended stuff
app.disable('x-powered-by')
app.use(helmet())

// STATE, STATE, STATE, STATE, STATE, STATE, STATE, STATE
const games = {};

//enable websocket
app.ws('/ws/:gameId', function(ws, req) {
	const gameId = req.params.gameId;
	console.log('new game: ', req.params);
	games[req.params.gameId] = {
		conn: ws,
		players: {}
	};
	ws.on('message', function(msg) {
		console.log('message from', req.params, msg);
	});

	ws.on('close', function(code, reason) {
		console.log('game left', gameId);
		for(const playerId in games[gameId].players) {
			console.log('closing player connection:', gameId, playerId, code, reason);
			games[gameId].players[playerId].conn.close(4000, 'game left');
		}
		delete games[gameId];
	});
});

app.ws('/ws/:gameId/:playerId', function(ws, req) {
	const gameId = req.params.gameId;
	const playerId = req.params.playerId;
	console.log('new player: ', req.params);
	if(!games[gameId]) {
		console.log('new player rejected: ', req.params);
		ws.close();
	}
	games[gameId].players[playerId] = { conn: ws };
	
	ws.on('message', function(msg) {
		const json = JSON.parse(msg);
		console.log('message from', req.params, json.to);
	});
	ws.on('close', function(code, reason) {
		console.log('player left', req.params, code, reason);
		if(games[gameId]) {
			delete games[gameId].players[playerId];
		}
	});
});

//serve static resources
app.use('/static', express.static('public'))

app.listen(8000, function () {
  console.log('Example app listening on port 8000!');
});

localtunnel(8000 ,{subdomain: 'roboparcour'}, (err, tunnel) => {
	console.log('local tunnal available on: ', tunnel.url);
});
