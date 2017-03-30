const fieldModel = {
    tileData : [
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,2,0,0,0,0,2,1,0,1],
        [1,0,0,1,0,0,0,0,1,0,0,1],
        [1,0,0,1,0,1,1,0,1,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1]
    ], 
    items : [
        
    ],
    robots : [
        {
            id: 'robot1',
            x: 4, 
            y: 6,
            dir: 3
        }, {
            id: 'robot2',
            x: 7, 
            y: 6,
            dir: 3
        }
    ],
    tiles: ['empty','wall', 'pit'],
    commands: ['forward1', 'forward2', 'forward3', 'left', 'right', 'uturn', 'back1']
}

function dir2Vec(dir) {
    return {
        x: Math.cos(dir * Math.PI / 2), 
        y: Math.sin(dir * Math.PI / 2)
    }
}

function canMoveTo(tileData, x, y) {
    return tileData[y][x] !== 1;
}

function move(model, robot, dir, speed, callback) {
    const vec = dir2Vec(dir);
    const steps = Math.abs(speed);
    const singleStep = function(steps) {
        if(steps <= 0) {
            callback();
        } else {
            const newX = Math.round(robot.x + vec.x * Math.sign(speed));
            const newY = Math.round(robot.y + vec.y * Math.sign(speed));
            if(canMoveTo(model.tileData, newX, newY)) {
                robot.x = newX;
                robot.y = newY;
            }
            updateRobot([robot], () => singleStep(steps - 1));
        }
    }
    singleStep(steps);
}

function turn(model, robot, speed, callback) {
    robot.dir += speed;
    updateRobot([robot], callback);
}

function walk(model, robot, speed, callback) {
    move(model, robot, robot.dir, speed, callback);
}

function robotCommands(model, robot) {
    return {
        forward1: (callback) => walk(model, robot, 1, callback),
        forward2: (callback) => walk(model, robot, 2, callback),
        forward3: (callback) => walk(model, robot, 3, callback),
        back1: (callback) => walk(model, robot, -1, callback),
        right: (callback) => turn(model, robot, 1, callback),
        left: (callback) => turn(model, robot, -1, callback),
        uturn: (callback) => turn(model, robot, 2, callback)
    };
}

function randomOf(array, count) {
    const result = [];
    for(let i = 0; i < count; i++) {
        result.push(array[Math.floor(Math.random() * array.length)]);
    }
    return result;
}

function nextRound(model) {
    fieldModel.robots.forEach(robot => {
        robot.availableCommands = randomOf(model.commands, 10)
            .map(command => {return {
                command, 
                prio: Math.random()
             }});
        robot.selectedCommands = [];
        robot.commandInterface = robotCommands(model, robot);
        renderCommands(fieldModel, robot, selectCommand, unselectCommand);
    });
}

initField(fieldModel);
renderField(fieldModel);

fieldModel.robots.forEach(robot => {
    initCommands(fieldModel, robot);
});
nextRound(fieldModel);

function selectCommand(robot, command, index) {
    if(robot.selectedCommands.length < 5) {
        robot.availableCommands.splice(index, 1);
        robot.selectedCommands.push(command);
        renderCommands(fieldModel, robot, selectCommand, unselectCommand);
    }
}

function unselectCommand(robot, command, index) {
    robot.selectedCommands.splice(index, 1);
    robot.availableCommands.unshift(command);
    renderCommands(fieldModel, robot, selectCommand, unselectCommand);
}

function executeProgramm(model) {
    let done = true;
    const nextCommands = model.robots
        .map(robot => {return {robot, commandCard: robot.selectedCommands.shift()}})
        .filter(robotCommand => robotCommand.commandCard !== undefined)
        .sort((rc1, rc2) => rc2.commandCard.prio > rc1.commandCard.prio);
    console.log(nextCommands);

    if(nextCommands.length == 0) {
        nextRound(model);
        return;
    }

    const executeSingleRobotCommand = function() {
        const robotCommand = nextCommands.shift();
        if(!robotCommand) {
            setTimeout(() => executeProgramm(model), 1000);
            return;
        }
        robotCommand.robot.commandInterface[robotCommand.commandCard.command](executeSingleRobotCommand)
    }
    executeSingleRobotCommand();
    /*
    model.robots.forEach(robot => {
        const command = robot.selectedCommands.shift();
        renderCommands(model, robot, selectCommand, unselectCommand);
        if(command) {
            done = false;
            robot.commandInterface[command.command]();
        };
    });
    if(done) {
        nextRound(fieldModel);        
    } else {
        setTimeout(() => executeProgramm(model), 1000);
    }
    */
}

const executeBtn = div('execute').withText('EXECUTE').withClass('execute').appendTo(document.body).get();
executeBtn.addEventListener('click', () => executeProgramm(fieldModel));