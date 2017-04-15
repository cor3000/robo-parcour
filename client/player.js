let client;

const onGameMessage = event => {
    console.log("DEBUG Game Message: ", event.data);
};

connectToGameAs('test123', ['robot0', 'robot1', 'robot2', 'robot3'], onGameMessage)
    .then(playerClient => {
        console.log(playerClient)
        client = playerClient;
    });

