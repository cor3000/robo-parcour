function reconnectingWebSocket(url) {
	const conn = {
		send : (text) => conn.ws.send(text),
		close : (code, reason) => conn.ws.close(code, reason)
	};
	const createWebSocket = () => {
		conn.ws = new WebSocket(url);
		conn.ws.addEventListener('close', createWebSocket);
	}
	createWebSocket();
	return conn;
}