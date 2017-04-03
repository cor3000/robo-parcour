const level1Data = {
    dirs: {
      right: 0,  
      down: 1,  
      left: 2,  
      up: 3
    },
    tiles: {
        0: 'empty',
        1: 'wall', 
        2: 'pit', 
        3: 'wrench',
        4: 'spike',
        20: 'conveyor-right',
        21: 'conveyor-down',
        22: 'conveyor-left',
        23: 'conveyor-up',
        50: 'start-right',
        51: 'start-down',
        52: 'start-left',
        53: 'start-up',
    },
    tileData : [
        [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [ 1,50, 0, 0, 1, 0, 0, 0, 0, 0,52, 1],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
        [ 1, 1, 0, 2,22,22,22, 0, 0, 0, 0, 1],
        [ 1, 0, 0, 0, 0,20,20,20, 2, 0, 1, 1],
        [ 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [ 1,50,53,53,53, 0, 0, 1, 0, 0,52, 1],
        [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ], 
    items : [
    ]
};

const gameModel = {
    robots : [],
    items: [],
    commands: ['forward1', 'forward2', 'forward3', 'left', 'right', 'uturn', 'back1']
}

function initGameModel(model, levelData) {
    let idCounter = 0;
    const items = [];
    levelData.tileData.forEach((row, y) => {
        row.forEach((tileId, x) => {
            if(tileId !== 0 /*empty*/) {
                const typeAndDir = levelData.tiles[tileId].split('-');
                const type = typeAndDir[0];
                const dir = typeAndDir[1] ? levelData.dirs[typeAndDir[1]] : 0;
                items.push({
                    id: type + '-' + idCounter++,
                    typeId: tileId,
                    type: type,
                    x: x,
                    y: y,
                    dir: dir
                });
            }
        });
    });
    model.items = items;
}

function dir2Vec(dir, dist) {
    if(dist && dist < 0) dir += 2;
    return {
        x: Math.round(Math.cos(dir * Math.PI / 2)), 
        y: Math.round(Math.sin(dir * Math.PI / 2))
    }
}

function objectsAt(objList, x, y) {
    return objList.filter(obj => obj.x === x && obj.y === y);
}

function robotAt(model, x, y) {
    return objectsAt(model.robots, x, y)[0];
}

function itemsAt(model, x, y, type) {
    const items = objectsAt(model.items, x, y);
    if(type) {
        return items.filter(item => item.type === type);
    }
    return items;
}

function tryMoveTo(model, robot, vec) {
    const newX = Math.round(robot.x + vec.x);
    const newY = Math.round(robot.y + vec.y);
    if(itemsAt(model, newX, newY, 'wall')[0] /*is wall*/) {
        return [];
    };
    const robotToPush = robotAt(model, newX, newY);
    if(robotToPush) {
        robotsToPush = tryMoveTo(model, robotToPush, vec);
        if(robotsToPush.length > 0) {
            return robotsToPush.concat(robot);
        } else {
            return [];
        }
    }
    return [robot];
}

function move(model, robot, dist, callback) {
    const vec = dir2Vec(robot.dir, dist);
    const steps = Math.abs(dist);
    const singleStep = function(steps) {
        if(steps <= 0) {
            callback();
        } else {
            const robotsToMove = tryMoveTo(model, robot, vec);
            if(robotsToMove.length == 0) {
                callback();
                return;
            }
            robotsToMove.forEach(robotToMove => {
                robotToMove.x += vec.x;
                robotToMove.y += vec.y;
            });
            updateRobot(robotsToMove, () => singleStep(steps - 1));
        }
    }
    singleStep(steps);
}

function turn(model, robot, speed, callback) {
    robot.dir += speed;
    updateRobot([robot], callback);
}

function robotCommands(model, robot) {
    return {
        forward1: (callback) => move(model, robot, 1, callback),
        forward2: (callback) => move(model, robot, 2, callback),
        forward3: (callback) => move(model, robot, 3, callback),
        back1: (callback) => move(model, robot, -1, callback),
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
    model.robots.forEach(robot => {
        robot.availableCommands = randomOf(model.commands, 10)
            .map(command => {return {
                command, 
                prio: Math.random()
             }});
        robot.selectedCommands = [];
        robot.commandInterface = robotCommands(model, robot);
        renderCommands(model, robot, selectCommand, unselectCommand);
    });
}

function selectCommand(robot, command, index) {
    if(robot.selectedCommands.length < 5) {
        robot.availableCommands.splice(index, 1);
        robot.selectedCommands.push(command);
        renderCommands(gameModel, robot, selectCommand, unselectCommand);
    }
}

function unselectCommand(robot, command, index) {
    robot.selectedCommands.splice(index, 1);
    robot.availableCommands.unshift(command);
    renderCommands(gameModel, robot, selectCommand, unselectCommand);
}

function executeProgramm(model) {
    let done = true;
    const nextCommands = model.robots
        .map(robot => {return {robot, commandCard: robot.selectedCommands.shift()}})
        .filter(robotCommand => robotCommand.commandCard !== undefined)
        .sort((rc1, rc2) => rc2.commandCard.prio > rc1.commandCard.prio);
    //TODO: fill with random commands if not filled correctly

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
}

initGameModel(gameModel, level1Data);
initField(gameModel);


function startGame(numPlayers, gameModel) {
    const starts = gameModel.items.filter(item => item.type === 'start');
    for(let i = 0; i < numPlayers; i++) {
        const startIndex = Math.floor(Math.random() * starts.length);
        const start = starts.splice(startIndex, 1)[0];
        const robot = {
            id: 'robot' + i,
            dir: start.dir,
            energy: 10,
            x: start.x,
            y: start.y,
            checkPoint: start.id,
        };
        start.ownerId = robot.id;
        gameModel.robots.push(robot);
    }
}

startGame(4, gameModel);

renderField(gameModel);

gameModel.robots.forEach(robot => {
    initCommands(gameModel, robot);
});

const executeBtn = div('execute').withText('EXECUTE').withClass('execute').appendTo(document.body).get();
executeBtn.addEventListener('click', () => executeProgramm(gameModel));

nextRound(gameModel);
