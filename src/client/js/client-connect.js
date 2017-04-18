import Promise from 'promise';
import ReconnectingWebsocket from 'reconnecting-websocket';

const CLOSE_GAME_ALREADY_EXISTS = 4001;
const CLOSE_GAME_DOESNT_EXIST = 4002;
const CLOSE_PLAYER_ALREADY_EXISTS = 4003;

const CONFIRM_PLAYER = 'confirmPlayer';
const CONFIRM_GAME = 'confirmGame';

const protocol = window.location.protocol.replace('http', 'ws');
const host = window.location.host;
const endpointUrl = `${protocol}//${host}/ws`;

function parseMessage(msg) {
    return new Promise(resolve => {
        resolve(JSON.parse(msg));
    });
}

function connectAsGame(gameId, onMessage) {
    return new Promise((resolve, reject) => {
        const ws = new ReconnectingWebsocket(`${endpointUrl}/${gameId}`);
        const onClose = event => {
            console.log(event);
            if(event.code === CLOSE_GAME_ALREADY_EXISTS) {
                ws.removeEventListener('close', onClose);
                ws.removeEventListener('message', onConfirmMessage);
                ws.close(1000, '', {keepClosed: true});
            }
            reject('game already exists')
        };
        const onConfirmMessage = event => {
            console.log(event);
            if(event.data === CONFIRM_GAME) {
                ws.addEventListener('message', onMessage);
            }
            ws.removeEventListener('close', onClose);
            ws.removeEventListener('message', onConfirmMessage);
            resolve({
                gameId,
                conn: ws
            });
        };
        ws.addEventListener('close', onClose);
        ws.addEventListener('message', onConfirmMessage);
    });
}

function connectToGameAs(gameId, playerIds, onMessage) {
    return new Promise((resolve, reject) => {
        const playerId = playerIds.shift();
        if(!playerId) {
            console.log('DEBUG failed to connect to game');
            reject('DEBUG failed to connect to game');
            return;
        }
        const ws = new ReconnectingWebsocket(`${endpointUrl}/${gameId}/${playerId}`);
        const onClose = event => {
            console.log(event);
            if(event.code === CLOSE_PLAYER_ALREADY_EXISTS || event.code === CLOSE_GAME_DOESNT_EXIST) {
                ws.removeEventListener('close', onClose);
                ws.removeEventListener('message', onConfirmMessage);
                ws.close(1000, '', {keepClosed: true});
            }
            resolve(connectToGameAs(gameId, playerIds, onMessage));
        };
        const onConfirmMessage = event => {
            console.log(event);
            if(event.data === CONFIRM_PLAYER) {
                ws.addEventListener('message', onMessage);
            }
            ws.removeEventListener('close', onClose);
            ws.removeEventListener('message', onConfirmMessage);
            resolve({
                gameId,
                playerId,
                conn: ws
            });
        };
        ws.addEventListener('close', onClose);
        ws.addEventListener('message', onConfirmMessage);
    });
}

const gameMessageHandler = handler => event => {
    console.log("DEBUG Game Message: ", event.data);
    parseMessage(event.data)
        .then(handler)
        .catch(error => console.log("ERROR onGameMessage", error));
};

export {
    connectAsGame,
    connectToGameAs, 
    gameMessageHandler, 
    CLOSE_GAME_ALREADY_EXISTS, 
    CLOSE_GAME_DOESNT_EXIST, 
    CLOSE_PLAYER_ALREADY_EXISTS, 
    CONFIRM_PLAYER, 
	CONFIRM_GAME
};
