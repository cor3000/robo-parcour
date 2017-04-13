const CLOSE_GAME_DOESNT_EXIST = 4002;
const CLOSE_PLAYER_ALREADY_EXISTS = 4003;

const protocol = window.location.protocol.replace('http', 'ws');
const host = window.location.host;
const endpointUrl = `${protocol}//${host}/ws`;

function connectToGameAs(gameId, playerId) {
    const ws = new ReconnectingWebsocket(`${endpointUrl}/${gameId}/${playerId}`);
    const onClose = event => {
        console.log(event);
        if(event.code === CLOSE_PLAYER_ALREADY_EXISTS) {
            ws.removeEventListener('close', onClose);
            ws.close(1000, '', {keepClosed: true});
        }
    };
    ws.addEventListener('close', onClose);
    return ws;
}

playerConn = connectToGameAs('test123', 'robot0');
playerConn.addEventListener('message', (msg => {
    const gameEvent = JSON.parse(msg.data).event;
    console.log(gameEvent);
}));
