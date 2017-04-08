let idCounter = 0;
function nextId() {
    return idCounter++;
}

const ROBOT = 'robot';
const START = 'start';
const WALL = 'wall';
const PIT = 'pit';
const CHECKPOINT = 'checkpoint';
const REPAIR = 'repair';
const GEAR_LEFT_TURN = 'gearLeft';
const GEAR_RIGHT_TURN = 'gearRight';
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
        1: WALL, 
        2: PIT, 
        3: REPAIR,
        4: 'spike',
        5: GEAR_LEFT_TURN,
        6: GEAR_RIGHT_TURN,
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
        50: `${START}-right`,
        51: `${START}--down`,
        52: `${START}-left`,
        53: `${START}--up`,
        60: CHECKPOINT
    },
    tileData: [
        [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [ 1, 0,50, 0, 0, 0, 0,60, 0, 3, 0, 1],
        [ 1, 0, 0, 0, 2,25,22,22,26, 1,60, 1],
        [ 1,50, 0,25,22,30,60, 6,23,60, 0, 1],
        [ 1,50, 0,24,20,29, 2, 5,23, 6, 2, 1],
        [ 1, 0, 0, 0, 5,24,20,20,27, 0, 0, 1],
        [ 1, 0,50, 0, 3, 0, 0,60, 1, 0,60, 1],
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

function itemById(model, itemId) {
    return model.items.find(item => item.id === itemId);
}


function removeItem(model, item) {
    model.items.splice(model.items.indexOf(item), 1);
}

function aliveRobots(model) {
    return model.robots.filter(robot => !robot.death);
}

function robotsOn(model, type) {
    return aliveRobots(model)
        .map(r => { return {robot: r, item: itemsAt(model, r.x, r.y, type)[0]};})
        .filter(ri => ri.item);
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

function killRobot(death, robot) {
    robot.selectedCommands.length = 0;
    robot.death = death;
}

function checkPits(model, callback) {
    const robotsOnPits = robotsOn(model, PIT)
            .map(ri => ri.robot);

    robotsOnPits.forEach(killRobot.bind(this, 'pit'));

    animatePitDeath(robotsOnPits)
        .then(callback);
}

function checkEnergy(model, callback) {
    return new Promise((resolve, reject) => {
        const deadRobots = aliveRobots(model)
                .filter(robot => robot.energy <= 0);

        deadRobots.forEach(killRobot.bind(this, 'energy'));

        return animateEnergyDeath(deadRobots)
                .then(resolve)
    });
}

function move(model, robot, dist, callback) {
    if(robot.death) {
        callback();
        return;
    }
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
            const nextStepCallback = () => singleStep(steps - 1);
            updateRobot(robotsToMove, () => checkPits(model, nextStepCallback));
        }
    }
    singleStep(steps);
}

function turn(model, robot, speed, callback) {
    if(robot.death) {
        callback();
        return;
    }
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
        robot.availableCommands = randomOf(model.commands, robot.energy)
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
    robotsOn(model, [REPAIR, CHECKPOINT]).forEach(ri => {
        ri.robot.energy = Math.min(ri.robot.energy + 1, 10);
    });
    const respawnedRobots = model.robots
        .filter(robot => robot.death && robot.lives > 0)
        .map(robot => {
            delete robot.death;
            robot.lives--;
            robot.energy = 10;
            const respawnPoint = itemById(model, robot.respawnId);
            robot.x = respawnPoint.x;
            robot.y = respawnPoint.y;
            return robot;
        });
    if(respawnedRobots.length > 0) {
        animateRespawn(respawnedRobots, callback())
    } else {
        callback();
    }
}

function executeProgramm(model) {
    let done = true;
    const nextCommands = model.robots
        .map(robot => {return {robot, commandCard: robot.selectedCommands.shift()}})
        .filter(robotCommand => robotCommand.commandCard !== undefined)
        .sort((rc1, rc2) => rc2.commandCard.prio > rc1.commandCard.prio);

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
        const moveConveyors = (callback) => {
            robotsOn(model, [CONVEYOR, CONVEYOR_LEFT_TURN, CONVEYOR_RIGHT_TURN])
                .forEach(rc => {
                    const vec = dir2Vec(rc.item.dir);
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
        }

        const turnGears = (callback) => {
            robotsOn(model, [GEAR_LEFT_TURN, GEAR_RIGHT_TURN])
                .forEach(rg => {
                    if(rg.item.type === GEAR_LEFT_TURN) rg.robot.dir -= 1;
                    if(rg.item.type === GEAR_RIGHT_TURN) rg.robot.dir += 1;
                });
            animateGears();
            updateRobot(model.robots, callback);
        }

        moveConveyors(() => turnGears(callback));
    };

    const fireLasers = function(callback) {
        console.log('fireLasers');
        const beams = model.robots
            .filter(robot => !robot.death)
            .map(robot => {
                const vec = dir2Vec(robot.dir);
                let target = null;
                let shotX = robot.x;
                let shotY = robot.y;
                let distance = 0;
                while(!target) {
                    distance++;
                    shotX += vec.x;
                    shotY += vec.y;
                    target = 
                        itemsAt(model, shotX, shotY, WALL)[0] ||
                        robotAt(model, shotX, shotY);
                }
                const beam = {
                    from: robot,
                    to: target,
                    vec: vec,
                    distance: distance
                };
                return beam;
            });
        
        animateLaserFire(model, beams, () => {
            //handle damage
            const killedRobots = [];
            beams.filter(beam => beam.to.energy)
                .forEach(beam => {
                    const target = beam.to;
                    target.energy--;
                });
            checkEnergy(model).then(callback);
        });
    };

    const handleCheckpoints = function(callback) {
        console.log('handleCheckpoints');
        robotsOn(model, [START, CHECKPOINT, REPAIR]).forEach(ri => {
            const {item, robot} = ri;
            ri.robot.respawnId = item.id;
            if(item.type === CHECKPOINT) {
                const oldCheckpointIndex = model.checkpoints.indexOf(robot.checkpointId);
                const newCheckpointIndex = model.checkpoints.indexOf(item.id);
                if(newCheckpointIndex - oldCheckpointIndex === 1) {
                    robot.checkpointId = item.id;
                    console.log(robot.id, 'reached', robot.checkpointId);
                }
            }
        });
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
            type: ROBOT,
            dir: start.dir,
            energy: 10,
            lives: 3,
            x: start.x,
            y: start.y,
            checkpointId: start.id,
            respawnId: start.id
        };
        start.ownerId = robot.id;
        gameModel.robots.push(robot);
    }
    const checkpoints = gameModel.items.filter(item => item.type === CHECKPOINT);
    gameModel.checkpoints = [];
    for(let i = 0; i < options.numCheckpoints; i++) {
        const checkpointIndex = Math.floor(Math.random() * checkpoints.length);
        const checkpoint = checkpoints.splice(checkpointIndex, 1)[0];
        gameModel.checkpoints.push(checkpoint.id);
        checkpoint.index = i;
    }
    //remove unused checkpoints
    checkpoints.forEach(cp => removeItem(gameModel, cp));

    initField(gameModel);
    renderField(gameModel);

    gameModel.robots.forEach(robot => {
        initCommands(gameModel, robot);
    });

    const executeBtn = div('execute').withText('EXECUTE').withClass('execute').appendTo(document.body).get();

    //TODO: fill with random commands if not filled correctly
    executeBtn.addEventListener('click', () => executeProgramm(gameModel));

    nextRound(gameModel);
}

/*
function pickRandomFromAvailable(robot) {
    const numCommands = robot.availableCommands.length;
    if(numCommands) {
        const index = Math.floor(Math.random * numCommands);
        return robot.availableCommands.splice(index, 1)[0];
    }
    return undefined; 
}
*/

startGame(gameModel, {
    numPlayers: 2, 
    numCheckpoints: 3, 
    levelData: level1Data
});
