let idCounter = 0;
function nextId() {
    return idCounter++;
}

const gameModel = {
    robots : [],
    items: [],
    commands: ['forward1', 'forward2', 'forward3', 'left', 'right', 'uturn', 'back1']
}

function dir2Vec(dir, dist) {
    if(dist && dist < 0) dir += 2;
    return {
        x: Math.round(Math.cos(dir * Math.PI / 2)), 
        y: Math.round(Math.sin(dir * Math.PI / 2))
    }
}

function vec2Dir(vec) {
    return Math.round((Math.atan2(vec.y, vec.x) / Math.PI * 2 + 4)) % 4;
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

function itemById(model, id) {
    return model.items.find(item => item.id === id);
}

function robotById(model, id) {
    return model.robots.find(robot => robot.id === id);
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

function robotsOutside(model) {
    return aliveRobots(model)
        .filter(robot => isOutside(model, robot));
}

function isOutside(model, {x, y}) {
    const {width, height} = model.dimensions;
    return x < 0 || y < 0 || x >= width || y >= height;
}

function isWayBlocked(model, pos, vec) {
    const newX = Math.round(pos.x + vec.x);
    const newY = Math.round(pos.y + vec.y);
    const dir = vec2Dir(vec);
    if(itemsAt(model, newX, newY, CRATE)[0]) return true;
    const wallsAtPos = itemsAt(model, pos.x, pos.y, WALL);
    if(wallsAtPos.find(wall => wall.dir === dir)) return true;
    const wallsAtNewPos = itemsAt(model, newX, newY, WALL);
    if(wallsAtNewPos.find(wall => wall.dir === ((dir + 2) % 4))) return true;
    return false;
}

function tryMoveTo(model, robot, vec) {
    if(isWayBlocked(model, robot, vec)) return [];
    const newX = Math.round(robot.x + vec.x);
    const newY = Math.round(robot.y + vec.y);
    const robotToPush = robotAt(model, newX, newY);
    if(robotToPush && !robotToPush.death) {
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

function checkFalling(model) {
    return new Promise((resolve, reject) => {
        const robotsFalling = robotsOn(model, PIT)
                .map(ri => ri.robot)
                .concat(robotsOutside(model));
        
        robotsFalling.forEach(killRobot.bind(this, 'falling'));

        animatePitDeath(robotsFalling)
            .then(resolve);
    });
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

function move(model, robot, dist) {
    return new Promise((resolve, reject) => {
        const vec = dir2Vec(robot.dir, dist);
        const steps = Math.abs(dist);
        
        const singleStep = function(steps) {
            if(robot.death || steps <= 0) {
                resolve();
            } else {
                const robotsToMove = tryMoveTo(model, robot, vec);
                if(robotsToMove.length == 0) {
                    resolve();
                    return;
                }
                robotsToMove.forEach(robotToMove => {
                    robotToMove.x += vec.x;
                    robotToMove.y += vec.y;
                });
                updateRobot(robotsToMove)
                    .then(() => checkFalling(model))
                    .then(() => singleStep(steps - 1));
            }
        }
        singleStep(steps);
    });
}

function turn(model, robot, speed, callback) {
    return new Promise((resolve, reject) => {
        if(robot.death) {
            resolve();
            return;
        }
        robot.dir += speed;
        updateRobot([robot])
            .then(resolve);
    });
}

function robotCommands(model, robot) {
    return {
        forward1: () => move(model, robot, 1),
        forward2: () => move(model, robot, 2),
        forward3: () => move(model, robot, 3),
        back1: () => move(model, robot, -1),
        right: () => turn(model, robot, 1),
        left: () => turn(model, robot, -1),
        uturn: () => turn(model, robot, 2)
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
        robot.availableCommands = randomOf(model.commands, robot.energy)
            .map(command => {return {
                id: 'command-card-'+nextId(),
                robotId: robot.id,
                command, 
                prio: Math.random()
             }});
        robot.selectedCommands = [];
        robot.lockedCommands = [];
        client.conn.send(JSON.stringify({to: [robot.id], data: {robot}}));
    });
}

function cleanupRound(model) {
    return new Promise((resolve, reject) => {
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
        animateRespawn(respawnedRobots).then(resolve);
    });
}

function executeProgramm(model) {
    
    const moveWorld = function() {
        return new Promise((resolve, reject) => {
            const moveConveyors2 = () => {
                return new Promise((resolve, reject) => {
                    robotsOn(model, [CONVEYOR_2, CONVEYOR_2_LEFT_TURN, CONVEYOR_2_RIGHT_TURN])
                        .forEach(rc => {
                            const vec = dir2Vec(rc.item.dir);
                            rc.robot.x += vec.x;
                            rc.robot.y += vec.y;
                            const conveyorTurn = itemsAt(model, rc.robot.x, rc.robot.y, [CONVEYOR_2_LEFT_TURN, CONVEYOR_2_RIGHT_TURN])[0]
                            if(conveyorTurn) {
                                if(conveyorTurn.type === CONVEYOR_2_LEFT_TURN) rc.robot.dir -= 1;
                                if(conveyorTurn.type === CONVEYOR_2_RIGHT_TURN) rc.robot.dir += 1;
                            }
                        });

                    animateConveyors2();
                    updateRobot(model.robots).then(resolve);
                });
            };
            const moveConveyors = () => {
                return new Promise((resolve, reject) => {
                    robotsOn(model, [CONVEYOR, CONVEYOR_LEFT_TURN, CONVEYOR_RIGHT_TURN, CONVEYOR_2, CONVEYOR_2_LEFT_TURN, CONVEYOR_2_RIGHT_TURN])
                        .forEach(rc => {
                            const vec = dir2Vec(rc.item.dir);
                            rc.robot.x += vec.x;
                            rc.robot.y += vec.y;
                            const conveyorTurn = itemsAt(model, rc.robot.x, rc.robot.y, 
                                        [CONVEYOR_LEFT_TURN, CONVEYOR_RIGHT_TURN, CONVEYOR_2_LEFT_TURN, CONVEYOR_2_RIGHT_TURN])[0]
                            if(conveyorTurn) {
                                if(conveyorTurn.type === CONVEYOR_LEFT_TURN) rc.robot.dir -= 1;
                                if(conveyorTurn.type === CONVEYOR_RIGHT_TURN) rc.robot.dir += 1;
                                if(conveyorTurn.type === CONVEYOR_2_LEFT_TURN) rc.robot.dir -= 1;
                                if(conveyorTurn.type === CONVEYOR_2_RIGHT_TURN) rc.robot.dir += 1;
                            }
                        });

                    animateConveyors();
                    animateConveyors2();
                    updateRobot(model.robots).then(resolve);
                });
            };

            const turnGears = () => {
                return new Promise((resolve, reject) => {
                    robotsOn(model, [GEAR_LEFT_TURN, GEAR_RIGHT_TURN])
                        .forEach(rg => {
                            if(rg.item.type === GEAR_LEFT_TURN) rg.robot.dir -= 1;
                            if(rg.item.type === GEAR_RIGHT_TURN) rg.robot.dir += 1;
                        });
                    animateGears();
                    updateRobot(model.robots).then(resolve);
                });
            };

            moveConveyors2()
                .then(() => checkFalling(model))
                .then(moveConveyors)
                .then(() => checkFalling(model))
                .then(turnGears)
                .then(resolve);

        });
    };

    const fireLasers = function() {
        return new Promise((resolve, reject) => {
            console.log('fireLasers');
            const beams = aliveRobots(model).map(robot => {
                    const vec = dir2Vec(robot.dir);
                    let target = null;
                    const path = {x: robot.x, y: robot.y};
                    let distance = 0;
                    while(!isWayBlocked(model, path, vec) &&!isOutside(model, path) && !target) {
                        distance++;
                        path.x += vec.x;
                        path.y += vec.y;
                        target = robotAt(model, path.x, path.y);
                    }
                    const beam = {
                        from: robot,
                        to: target || path,
                        vec: vec,
                        distance: distance
                    };
                    return beam;
                });

            if(beams.length > 0) {
                animateLaserFire(model, beams, () => {
                    //handle damage
                    const killedRobots = [];
                    beams.filter(beam => beam.to.energy)
                        .forEach(beam => {
                            const target = beam.to;
                            target.energy--;
                        });
                    checkEnergy(model).then(resolve);
                });
            } else {
                resolve();
            }
        });
    };

    const handleCheckpoints = () => {
        return new Promise((resolve, reject) => {
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
            resolve();
        })
    };

    const executeCommands = function(roundCommands) {
        return new Promise((resolve, reject) => {
            const commandCard = roundCommands[0];
            if(commandCard) {
                const commandInterface = robotCommands(model, robotById(model, commandCard.robotId));
                commandInterface[commandCard.command]()
                        .then(() => executeCommands(roundCommands.slice(1)))
                        .then(resolve);
            } else resolve();
       });
    };

    const roundCommands = model.robots
        .map(robot => robot.selectedCommands.shift())
        .filter(commandCard => commandCard !== undefined)
        .sort((cc1, cc2) => cc2.prio > cc1.prio);

    if(roundCommands.length == 0) {
        cleanupRound(model)
            .then(() => nextRound(model));
        return;
    }

    executeCommands(roundCommands)
        .then(handleCheckpoints)
        .then(moveWorld)
        .then(fireLasers)
        .then(() => setTimeout(() => executeProgramm(model), 1000));
}


function initRobot(model, robotId) {
    const robot = robotById(model, robotId);
    if(!robot) {
        const starts = model.items.filter(item => item.type === START);
        let start;
        while(!start || start.ownerId) {
            const startIndex = Math.floor(Math.random() * starts.length);
            start = starts[startIndex];
        }
        const robot = {
            id: robotId,
            type: ROBOT,
            dir: start.dir,
            energy: 10,
            lives: 3,
            x: start.x,
            y: start.y,
            checkpointId: start.id,
            respawnId: start.id,
            availableCommands: [],
            selectedCommands: [],
            lockedCommands: []
        };
        start.ownerId = robot.id;
        model.robots.push(robot);
    }
}


const onGameMessage = gameMessageHandler(data => {
    const model = gameModel;
    if(data.players) {
        //TODO: handle disconnect/reconnect
        data.players.forEach(player => {
            initRobot(model, player.id);
            renderRobot(model, robotById(model, player.id));
            renderField(model);
        });
    }
    const robot = robotById(model, data.playerId);
    if(robot) {
        if(data.uploadProgramm) {
            const {selectedCommandIds} = data.uploadProgramm;
            const selectedCommands = selectedCommandIds.map(ccId => robot.availableCommands.find(cc => cc.id === ccId));
            console.log(selectedCommands);
            robot.selectedCommands = selectedCommands;
        }
    }
});

function initGame(model, options) {
    const {items, dimensions} = loadLevel(options.levelId);
    model.items = items;
    model.dimensions = dimensions;
    model.checkpoints = [];
    const checkpoints = model.items.filter(item => item.type === CHECKPOINT);
    for(let i = 0; i < options.numCheckpoints; i++) {
        const checkpointIndex = Math.floor(Math.random() * checkpoints.length);
        const checkpoint = checkpoints.splice(checkpointIndex, 1)[0];
        model.checkpoints.push(checkpoint.id);
        checkpoint.index = i;
    }
    //remove unused checkpoints
    checkpoints.forEach(cp => removeItem(model, cp));

    initField(model);
    renderField(model);

    const startBtn = div('start').withText('START').withClass('mainButton').appendTo(document.body).get();
    startBtn.addEventListener('click', () => {
        startBtn.parentNode.removeChild(startBtn);
        startGame(model);
    });
}

function startGame(model) {
    nextRound(model);
    const executeBtn = div('execute').withText('EXECUTE').withClass('mainButton').appendTo(document.body).get();
    executeBtn.addEventListener('click', () => executeProgramm(model));
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

let client;
const connectForm = document.getElementById('connect');

connectForm.addEventListener('submit', event => {
    event.preventDefault();
    const gameId = connectForm.querySelector('#gameId').value;
    const numCheckpoints = parseInt(connectForm.querySelector('#numCheckpoints').value);
    const levelId = connectForm.querySelector('#levelId').value;

    connectAsGame(gameId, onGameMessage)
        .then(gameClient => {
            console.log(gameClient);
            client = gameClient;
            initGame(gameModel, {numCheckpoints, levelId});
        })
        .catch(reason => alert('error connecting: ' + reason))
        .then(connectForm.style.display = "none");
});

