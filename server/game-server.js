const express = require('express');
const helmet = require('helmet');
const app = express();
const localtunnel = require('localtunnel');

const expressWs = require('express-ws')(app);

const CLOSE_GAME_CLOSED = 4000;
const CLOSE_GAME_ALREADY_EXISTS = 4001;
const CLOSE_GAME_DOESNT_EXIST = 4002;
const CLOSE_PLAYER_ALREADY_EXISTS = 4003;

const CONFIRM_GAME = 'confirmGame';
const CONFIRM_PLAYER = 'confirmPlayer';

//security recommended stuff
app.disable('x-powered-by')
app.use(helmet())

function parseMessage(msg) {
    return new Promise((resolve, reject) => {
        resolve(JSON.parse(msg));
    });
}

// STATE, STATE, STATE, STATE, STATE, STATE, STATE, STATE
const games = {};
function addPlayer(gameId, playerId, ws) {
    games[gameId].players[playerId] = {
        id: playerId,
        gameId: gameId,
        conn: ws
    };
    sendPlayers(gameId);
}

function removePlayer(gameId, playerId) {
    if(games[gameId]) {
        delete games[gameId].players[playerId];
        sendPlayers(gameId);
    }
}

function playersArray(game) {
    const players = [];
    for(const key in game.players) {
        players.push(game.players[key]);
    }
    return players;
}

function sendPlayers(gameId) {
    const game = games[gameId];
    const players = playersArray(game).map(player => {return {id: player.id};});
    console.log('DEBUG sending players: ', players);
    game.conn.send(JSON.stringify({players}));
}

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
            parseMessage(msg)
               .then(json => json.to.forEach(
                    playerId => {
                        const playerConn = games[gameId].players[playerId].conn;
                        playerConn.send(JSON.stringify(json.data));
                    }))
               .catch(error => console.log('ERROR invalid message : ', msg))
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
        addPlayer(gameId, playerId, ws);

        ws.on('message', function(msg) {
            console.log('DEBUG message from', req.params, json);
            parseMessage(msg)
               .then(json => {
                        const gameConn = games[gameId].conn;
                        gameConn.send(JSON.stringify(json.data));
                    })
               .catch(error => console.log('ERROR invalid message : ', msg))
        });
        ws.on('close', function(code, reason) {
            console.log('INFO player left', req.params, code, reason);
            removePlayer(gameId, playerId);
        });
        resolve(games[gameId].players[playerId]);
    });
}

function confirmGame(game) {
    console.log('DEBUG confirm game:', game.id)
    game.conn.send(CONFIRM_GAME);
}

function confirmPlayer(player) {
    console.log('DEBUG confirm player:', player.id, player.gameId)
    player.conn.send(CONFIRM_PLAYER);
}

function closeConn(error) {
    const {ws, code, reason} = error;
    if(!ws || !code || !reason) {
        console.log('ERROR ',  arguments);
        return;
    }
    console.log('WARN close connection:', code, reason);
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
