let idCounter = 0;
function nextId() {
    return idCounter++;
}

const CHECKPOINT = 'checkpoint';
const REPAIR = 'repair';
const CONVEYOR = 'conveyor';
const CONVEYOR_LEFT_TURN = 'conveyorLeft';
const CONVEYOR_RIGHT_TURN = 'conveyorRight';

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
        3: REPAIR,
        4: 'spike',
        20: `${CONVEYOR}-right`,
        21: `${CONVEYOR}-down`,
        22: `${CONVEYOR}-left`,
        23: `${CONVEYOR}-up`,
        24: `${CONVEYOR_LEFT_TURN}-right`,
        25: `${CONVEYOR_LEFT_TURN}-down`,
        26: `${CONVEYOR_LEFT_TURN}-left`,
        27: `${CONVEYOR_LEFT_TURN}-up`,
        28: `${CONVEYOR_RIGHT_TURN}-right`,
        29: `${CONVEYOR_RIGHT_TURN}-down`,
        30: `${CONVEYOR_RIGHT_TURN}-left`,
        31: `${CONVEYOR_RIGHT_TURN}-up`,
        50: 'start-right',
        51: 'start-down',
        52: 'start-left',
        53: 'start-up',
        60: CHECKPOINT
    },
    tileData : [
        [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [ 1,50, 0, 0, 1,60, 0, 0, 3, 0,52, 1],
        [ 1, 0, 0, 0,25,22,22,26, 1, 0, 0, 1],
        [ 1, 1, 0, 2,21, 0, 0,23,60, 0, 0, 1],
        [ 1, 0, 0,60,21, 0,60,23, 2, 0, 1, 1],
        [ 1, 0, 0, 1,24,20,20,27, 0, 0, 0, 1],
        [ 1,50, 0, 3, 0, 0, 60, 1, 0, 0,52, 1],
        //[ 1,50,53,53,53, 0, 0, 1, 0, 0,52, 1],
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
    const items = [];
    levelData.tileData.forEach((row, y) => {
        row.forEach((tileId, x) => {
            if(tileId !== 0 /*empty*/) {
                const typeAndDir = levelData.tiles[tileId].split('-');
                const type = typeAndDir[0];
                const dir = typeAndDir[1] ? levelData.dirs[typeAndDir[1]] : 0;
                items.push({
                    id: type + '-' + nextId(),
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
        const types = [].concat(type);
        return items.filter(item => types.indexOf(item.type) >= 0);
    }
    return items;
}

function robotsOn(model, type) {
    return model.robots
        .map(r => { return {r, items: itemsAt(model, r.x, r.y, type)};})
        .filter(ri => ri.items.length);
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

function cleanupRound(model, callback) {
    console.log('repairRobots');
    model.robots.forEach(robot => {
        const repairSite = itemsAt(model, robot.x, robot.y, [REPAIR, CHECKPOINT])[0];
        if(repairSite) {
            robot.energy = Math.min(robot.energy + 1, 10);
        }
    });
    callback();
}


function executeProgramm(model, step) {
    let done = true;
    const nextCommands = model.robots
        .map(robot => {return {robot, commandCard: robot.selectedCommands.shift()}})
        .filter(robotCommand => robotCommand.commandCard !== undefined)
        .sort((rc1, rc2) => rc2.commandCard.prio > rc1.commandCard.prio);
    //TODO: fill with random commands if not filled correctly

    if(nextCommands.length == 0) {
        cleanupRound(model, () => nextRound(model));
        return;
    }

    const executeCommands = function(robotCommands, callback) {
        const robotCommand = robotCommands[0];
        if(robotCommand) {
            const commandName = robotCommand.commandCard.command;
            robotCommand.robot.commandInterface[commandName](
                () => executeCommands(robotCommands.slice(1), callback)
            );
        } else {
            callback();
        }
    };

    const moveWorld = function(callback) {
        console.log('moveWorld');
        console.log('conveyors');
        model.robots
            .map(robot => {return {
                    robot, 
                    conveyor: itemsAt(model, robot.x, robot.y, [CONVEYOR, CONVEYOR_LEFT_TURN, CONVEYOR_RIGHT_TURN])[0]
                }})
            .filter(robotConveyor => robotConveyor.conveyor) /*robots on conveyor*/
            .forEach(rc => {
                const vec = dir2Vec(rc.conveyor.dir);
                rc.robot.x += vec.x;
                rc.robot.y += vec.y;
                const conveyorTurn = itemsAt(model, rc.robot.x, rc.robot.y, [CONVEYOR_LEFT_TURN, CONVEYOR_RIGHT_TURN])[0]
                if(conveyorTurn) {
                    if(conveyorTurn.type === CONVEYOR_LEFT_TURN) rc.robot.dir -= 1;
                    if(conveyorTurn.type === CONVEYOR_RIGHT_TURN) rc.robot.dir += 1;
                }
            });
        animateConveyors();
        updateRobot(model.robots, callback);
    };

    const fireLasers = function(callback) {
        console.log('fireLasers');
        callback();
    };

    const handleCheckpoints = function(callback) {
        console.log('handleCheckpoints');

        callback();
    };

    const executeStepSequence = function(sequence) {
        const next = sequence[0];
        if(next) {
            next(() => executeStepSequence(sequence.slice(1)));
        } else {
            setTimeout(() => executeProgramm(model), 1000);
        }
    };

    executeStepSequence([
        executeCommands.bind(this, nextCommands),
        moveWorld, 
        fireLasers, 
        handleCheckpoints
    ]);

}


function startGame(gameModel, options) {
    initGameModel(gameModel, options.levelData);

    const starts = gameModel.items.filter(item => item.type === 'start');
    for(let i = 0; i < options.numPlayers; i++) {
        const startIndex = Math.floor(Math.random() * starts.length);
        const start = starts.splice(startIndex, 1)[0];
        const robot = {
            id: 'robot' + i,
            dir: start.dir,
            energy: 10,
            lives: 3,
            x: start.x,
            y: start.y,
            startId: start.id,
            respawnId: start.id
        };
        start.ownerId = robot.id;
        gameModel.robots.push(robot);
    }
    const checkpoints = gameModel.items.filter(item => item.type === CHECKPOINT);
    for(let i = 0; i < options.numCheckpoints; i++) {
        const checkpointIndex = Math.floor(Math.random() * starts.length);
        const checkpoint = checkpoints.splice(checkpointIndex, 1)[0];
        checkpoints.push({
            checkpointId: CHECKPOINT + '-' + nextId(),
        });
        checkpoint.index = i;
    }

    initField(gameModel);
    renderField(gameModel);

    gameModel.robots.forEach(robot => {
        initCommands(gameModel, robot);
    });

    const executeBtn = div('execute').withText('EXECUTE').withClass('execute').appendTo(document.body).get();
    executeBtn.addEventListener('click', () => executeProgramm(gameModel));

    nextRound(gameModel);
}

startGame(gameModel, {
    numPlayers: 2, 
    numCheckpoints: 3, 
    levelData: level1Data
});
