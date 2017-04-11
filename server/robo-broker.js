const ws = require("nodejs-websocket");

const isGame = (conn) => {
	return conn.path.split('/').length === 3;
}
const isPlayer = (conn) => {
	return conn.path.split('/').length === 4;
}

const gamePath = (playerPath) => {
	return playerPath.substring(0, playerPath.lastIndexOf('/'));
};

const checkConnection = (server, conn) => {
	return new Promise((resolve, reject) => {
		const pattern = /^\/robo\/[a-zA-Z0-9]{1,64}(\/robot[0123])?$/;
		const validPath = pattern.test(conn.path);
		if(!validPath) {
			reject('ERROR: Invalid Path: "' + conn.path + '" - not matching path pattern ' + pattern);
			return;
		}
		
		if(isGame(conn)) {
			console.log('checking Game request: ', conn.path);
			const existingConn = server.connections
						.find(existingConn => existingConn !== conn && existingConn.path === conn.path);
			const unique = existingConn === undefined;
			if(!unique) {
				reject('ERROR: existing Game: ' + conn.path);
				return;
			}
			console.log('Game NEW: ', conn.path);
		}
		
		if(isPlayer(conn)) {
			console.log('checking Player request: ', conn.path);
			const existingPlayer = server.connections
						.find(existingConn => existingConn !== conn && existingConn.path === conn.path);
			if(existingPlayer !== undefined) {
				reject('ERROR: existing Player: ' + conn.path);
				return;
			}
			
			const existingGame = server.connections
						.find(existingConn => existingConn !== conn && existingConn.path === gamePath(conn.path));
			if(existingGame === undefined) {
				reject('ERROR: game does not exist for Player: ' + conn.path);
				return;
			}
			console.log('Player NEW: ', conn.path);
		}
		resolve(conn);
	});
};

const server = ws.createServer(conn => {
	const registerListeners = (conn) => {
		conn.on("text", function (str) {
			if(isGame(conn)) {
				console.log("From Game: " + conn.path + " >> " + str);
			} else if(isPlayer(conn)) {
				console.log("From Player: " + conn.path + " >> " + str) ;
			}
		});
		
		conn.on("close", function (code, reason) {
			console.log("Connection closed", conn.path);
		});
	};

	checkConnection(server, conn)
		.then(registerListeners)
		.catch(reason => {
			console.log(reason);
			conn.close();
		});
	return;
	
}).listen(8001);

console.log("robo parcour game broking server started");
console.log("listening games & players on:            ws://localhost:8001/robo/GAME_ID[/PLAYER_ID]");
