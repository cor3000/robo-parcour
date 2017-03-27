const fieldModel = {
    tileData : [
        [1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,1],
        [1,0,2,0,0,2,0,1],
        [1,0,1,0,0,1,0,1],
        [1,0,0,0,0,0,0,1],
        [1,0,0,1,1,0,0,1],
        [1,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1]
    ], 
    items : [
    
    ],
    robots : [
        {
            id: 'robot1',
            x: 2, 
            y: 6,
            dir: 3
        }, {
            id: 'robot2',
            x: 5, 
            y: 6,
            dir: 3
        }
    ],
    tiles: ['empty','wall', 'pit'],
    commands: ['forward1', 'forward2', 'forward3', 'left', 'right', 'uturn', 'back1']
}

function div(id) {
    let elem = document.getElementById(id);
    if(!elem) {
        elem = document.createElement('div');
        elem.id = id;
    };
    const ops = {
        size: (w, h) => {
            elem.style.width = `${w}px`;
            elem.style.height = `${h}px`;
            return ops;
        },
        atPos: (x, y) => {
            TweenLite.to(elem, 0.5, {x:x, y:y});
            //elem.style.transform = `translate(${x}px, ${y}px)`;
            return ops;
        },

        rot: (angle) => {
            TweenLite.to(elem, 0.5, {rotation:angle})            
            //elem.style.transform += ` rotate(${angle}deg)`;
            return ops;
        },

        withClass: (cls) => {
            if(elem.getAttribute('class') !== cls) {
                elem.setAttribute('class', cls);
            }
            return ops;
        },

        withText: text => {
            if(text !== elem.innerText) {
                elem.innerText = text;
            }
            return ops;
        },

        appendTo: (parent) => {
            if(parent !== elem.parent) {
                parent.appendChild(elem);
            }
            return ops;
        },

        clear: () => {
            while (elem.hasChildNodes()) {
                elem.removeChild(elem.lastChild);
            }
            return ops;
        },

        get: () => elem
    }
    return ops;
}

function tile(id, x, y, tileClass) {
    return div(id).size(50, 50).atPos(x * 50, y * 50).withClass(`tile ${tileClass}`);
}

function renderRobot(model, robot) {
    tile(robot.id, robot.x, robot.y, 'robot').rot(robot.dir * 90).appendTo(model.fieldElem);
}

function renderField(model, fieldElem) {
    model.tileData.forEach((tileRow, row) => {
        tileRow.forEach((tileId, col) => {
            tile(`tile${row}_${col}`, col, row, model.tiles[tileId]).appendTo(fieldElem);
        });
    });
    model.robots.forEach(robot => renderRobot(model, robot));
}

function initField(model) {
    const fieldElem = div('field').withClass('field').appendTo(document.body).get();
    model.fieldElem = fieldElem;
    renderField(model, fieldElem);
}

function initCommands(model, robot) {
    model.commandsElem = div(`${robot.id}-commands`).withClass(`robotCommands ${robot.id}`).appendTo(document.body).get();
    robot.selectedCommandsElem = div(`${robot.id}-selected`).withClass(`selected`).appendTo(model.commandsElem).clear().get();
    robot.availableCommandsElem = div(`${robot.id}-available`).withClass(`available`).appendTo(model.commandsElem).clear().get();
}

function renderCommands(model, robot) {
    const availableCommandsElem = div(robot.availableCommandsElem.id).clear().get();
    const selectedCommandsElem = div(robot.selectedCommandsElem.id).clear().get();

    robot.availableCommands.forEach((command, index) => {
        const cmdElem = div(`${robot.id}-command-available-${index}`).withClass(`command ${command}`).withText(command).appendTo(availableCommandsElem).get();
        cmdElem.addEventListener('click', () => {
            if(robot.selectedCommands.length < 5) {
                robot.availableCommands.splice(index, 1);
                robot.selectedCommands.push(command);
                renderCommands(model, robot);
            }
        });
    });
    robot.selectedCommands.forEach((command, index) => {
        const cmdElem = div(`${robot.id}-command-selected-${index}`).withClass(`command ${command}`).withText(command).appendTo(selectedCommandsElem).get();
        cmdElem.addEventListener('click', () => {
            robot.selectedCommands.splice(index, 1);
            robot.availableCommands.push(command);
            renderCommands(model, robot);
        });
    });
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

function move(model, robot, dir, speed) {
    const vec = dir2Vec(dir);
    let steps = Math.abs(speed);
    while(0 < steps--) {
        const newX = Math.round(robot.x + vec.x * Math.sign(speed));
        const newY = Math.round(robot.y + vec.y * Math.sign(speed));
        if(canMoveTo(model.tileData, newX, newY)) {
            robot.x = newX;
            robot.y = newY;
        }
    }
    renderRobot(model, robot);
}

function turn(model, robot, speed) {
    robot.dir += speed;
    renderRobot(model, robot);
}

function walk(model, robot, speed) {
    move(model, robot, robot.dir, speed);
}

function robotCommands(model, robot) {
    return {
        forward1: () => walk(model, robot, 1),
        forward2: () => walk(model, robot, 2),
        forward3: () => walk(model, robot, 3),
        back1: () => walk(model, robot, -1),
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
    fieldModel.robots.forEach(robot => {
        robot.availableCommands = randomOf(model.commands, 10);
        robot.selectedCommands = [];
        robot.commandInterface = robotCommands(model, robot);

        renderCommands(fieldModel, robot);
    });
}

initField(fieldModel);
fieldModel.robots.forEach(robot => {
    initCommands(fieldModel, robot);
});
nextRound(fieldModel);

function executeProgramm(model) {
    let done = true;
    fieldModel.robots.forEach(robot => {
        const command = robot.selectedCommands.shift();
        renderCommands(model, robot);
        if(command) {
            done = false;
            robot.commandInterface[command]();
        };
    });

    if(done) {
        nextRound(fieldModel);        
    } else {
        setTimeout(() => executeProgramm(model), 1000);
    }
}

const executeBtn = div('execute').withText('EXECUTE').withClass('execute').appendTo(document.body).get();
executeBtn.addEventListener('click', () => executeProgramm(fieldModel));