const express = require('express');
const helmet = require('helmet');
const app = express();
const localtunnel = require('localtunnel');

const expressWs = require('express-ws')(app);

const CLOSE_GAME_CLOSED = 4000;
const CLOSE_GAME_ALREADY_EXISTS = 4001;
const CLOSE_GAME_DOESNT_EXIST = 4002;
const CLOSE_PLAYER_ALREADY_EXISTS = 4003;

//security recommended stuff
app.disable('x-powered-by')
app.use(helmet())

// STATE, STATE, STATE, STATE, STATE, STATE, STATE, STATE
const games = {};

function initGame(ws, req) {
    return new Promise((resolve, reject) => {
    	const gameId = req.params.gameId;
	    if(games[gameId]) {
		    reject({ws, code: CLOSE_GAME_ALREADY_EXISTS, reason: `game already exists (params: ${req.params})`});
            return;
	    }

	    games[gameId] = {
            id: gameId,
		    conn: ws,
		    players: {}
	    };

	    ws.on('message', function(msg) {
		    console.log('DEBUG message from', req.params, msg);
	    });

	    ws.on('close', function(code, reason) {
		    console.log('INFO game closed', gameId);
		    for(const playerId in games[gameId].players) {
			    console.log('closing player connection:', gameId, playerId, code, reason);
			    games[gameId].players[playerId].conn.close(CLOSE_GAME_CLOSED, 'game closed');
		    }
		    delete games[gameId];
	    });

        resolve(games[gameId]);
    });
}

function initPlayer(ws, req) {
    return new Promise((resolve, reject) => {
        const gameId = req.params.gameId;
        const playerId = req.params.playerId;
        if(!games[gameId]) {
            reject({ws, code: CLOSE_GAME_DOESNT_EXIST, reason: `game doesn\'t exist (params: ${req.params})`});
            return;
        }
        if(games[gameId].players[playerId]) {
            reject({ws, code: CLOSE_PLAYER_ALREADY_EXISTS, reason: `player already exists (params: ${req.params})`});
            return;
        }
        games[gameId].players[playerId] = {
            id: playerId,
            gameId: gameId,
            conn: ws
        };

        ws.on('message', function(msg) {
            const json = JSON.parse(msg);
            console.log('DEBUG message from', req.params, json);
        });
        ws.on('close', function(code, reason) {
            console.log('INFO player left', req.params, code, reason);
            if(games[gameId]) {
                delete games[gameId].players[playerId];
            }
        });

        resolve(games[gameId].players[playerId]);
    });
}


function confirmGame(game) {
    const message = {event: {name: 'gameConfirm', data: {id: game.id}}}
    console.log('DEBUG confirm game:', message)
    game.conn.send(JSON.stringify(message));
}

function confirmPlayer(player) {
    const message = {event: {name: 'playerConfirm', data: {id: player.id, gameId: player.gameId}}}
    console.log('DEBUG confirm player:', message)
    player.conn.send(JSON.stringify(message));
}

function closeConn({ws, code, reason}) {
    console.log('WARN  close connection:', code, reason);
    console.log('DEBUG',  arguments);
    ws.close(code, reason);
}

//enable websocket
app.ws('/ws/:gameId', function(ws, req) {
	console.log('INFO  new game request: ', req.params);
    initGame(ws, req)
        .then(confirmGame)
        .catch(closeConn);
});

app.ws('/ws/:gameId/:playerId', function(ws, req) {
	console.log('INFO  new player request: ', req.params);
    initPlayer(ws, req)
        .then(confirmPlayer)
        .catch(closeConn);
});

//serve static resources
app.use('/client', express.static('../client'))

app.listen(8000, function () {
  console.log('Example app listening on port 8000');
  console.log('http://localhost:8000/client/game.html');
  console.log('http://localhost:8000/client/player.html');
});

/*
localtunnel(8000 ,{subdomain: 'roboparcour'}, (err, tunnel) => {
	console.log('local tunnal available on: ', tunnel.url);
});
*/
