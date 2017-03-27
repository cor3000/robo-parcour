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
    tiles: ['empty','wall', 'pit']
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
            elem.style.transform = `translate(${x}px, ${y}px)`;
            return ops;
        },

        rot: (angle) => {
            elem.style.transform += ` rotate(${angle}deg)`;
            return ops;
        },

        withClass: (cls) => {
            elem.setAttribute('class', cls);
            return ops;
        },

        withText: text => {
            elem.innerText = text;
            return ops;
        },

        appendTo: (parent) => {
            parent.appendChild(elem);
            return ops;
        },

        get: () => elem
    }
    return ops;
}

function tile(id, x, y, tileClass) {
    return div(id).size(50, 50).atPos(x * 50, y * 50).withClass(`tile ${tileClass}`);
}

function renderRobot(robot) {
    tile(robot.id, robot.x, robot.y, 'robot').rot(robot.dir * 90).appendTo(fieldElem);
}

function renderField(model, fieldElem) {
    model.tileData.forEach((tileRow, row) => {
        tileRow.forEach((tileId, col) => {
            tile(`tile${row}_${col}`, col, row, model.tiles[tileId]).appendTo(fieldElem);
        });
    });
    renderRobot(model.robots[0]);
    renderRobot(model.robots[1]);
}

const fieldElem = div().withClass('field').appendTo(document.body).get();
renderField(fieldModel, fieldElem);

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
    renderRobot(robot);
}

function turn(model, robot, speed) {
    robot.dir += speed;
    renderRobot(robot);
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

