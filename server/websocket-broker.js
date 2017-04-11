const ws = require("nodejs-websocket");

const isGame = (conn) => {
	console.log('isGame');
	return conn.path.split('/').length === 3;
}
const isPlayer = (conn) => {
	return conn.path.split('/').length === 4;
}

const gamePath = (playerPath) => {
	return playerPath.substring(0, playerPath.lastIndexOf('/'));
};

const isValidPath = (server, conn) => {
	const pattern = /^\/robo\/[a-zA-Z0-9]{1,64}(\/robot[0123])?$/;
	const validPath = pattern.test(conn.path);
	if(!validPath) {
		console.log('invalid Path: ', conn.path);
		return false;
	}
	
	if(isGame(conn)) {
		console.log('checking Game', conn.path);
		const existingConn = server.connections
					.find(existingConn => existingConn !== conn && existingConn.path === conn.path);
		const unique = existingConn === undefined;
		console.log('existing Game: ', conn.path);
		return false;
	}
	
	if(isPlayer(conn)) {
		console.log('checking Player', conn.path);
		const existingPlayer = server.connections
					.find(existingConn => existingConn !== conn && existingConn.path === conn.path);
		if(existingPlayer !== undefined) {
			console.log('existing Player: ', conn.path);
			return false;
		}
		console.log('Player OK: ', conn.path);
		
		const existingGame = server.connections
					.find(existingConn => existingConn !== conn && existingConn.path === gamePath(conn.path));
		if(existingGame === undefined) {
			console.log('game does not exist for Player: ', conn.path);
			return false;
		}
		console.log('Game OK: ', conn.path);
	}
	return true;
};

const server = ws.createServer(conn => {

	if(!isValidPath(server, conn)) {
		conn.close(4000, 'already connected or illegal path: ' + conn.path);
		console.log("Illegal or existing game", conn.path);
		return;
	};

	console.log("New Game", conn.path);
	
	conn.on("text", function (str) {
		if(isServer(conn)) {
			console.log("From Game: " + conn.path);
		} else if(isPlayer(conn)) {
			console.log("From Player: " + conn.path);
		}
	});
	
	conn.on("close", function (code, reason) {
		console.log("Connection closed", conn.path);
	});
}).listen(8001);
