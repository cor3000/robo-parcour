let client;

let model = {
    robot: {}
};

function selectCommand(robot, command, index) {
    if(robot.selectedCommands.length < 5) {
        robot.availableCommands.splice(index, 1);
        robot.selectedCommands.push(command);
        renderCommands(robot, selectCommand, unselectCommand);
    }
}

function unselectCommand(robot, command, index) {
    robot.selectedCommands.splice(index, 1);
    robot.availableCommands.unshift(command);
    renderCommands(robot, selectCommand, unselectCommand);
}

const onGameMessage = gameMessageHandler(data => {
    if(data.robot) {
        const robot = data.robot;
        console.log(robot);
        renderCommands(robot, selectCommand, unselectCommand);
        model.robot = robot;
    }
});

connectToGameAs('test123', ['robot0', 'robot1', 'robot2', 'robot3'], onGameMessage)
    .then(playerClient => {
        console.log(playerClient)
        client = playerClient;
    });

