const tileSize = 50;

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

        attr: (attr, value) => {
            if(value !== elem.getAttribute(attr)) {
                elem.setAttribute(attr, value);
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
    return div(id).size(tileSize, tileSize).atPos(x * tileSize, y * tileSize).withClass(`tile ${tileClass}`);
}

function commandCard(id, status, command) {
    return div(id)
        .withClass(`command ${command.command} ${status}`)
        .attr('data-prio', Math.round(command.prio * 1000));
}

function initField(model) {
    const fieldElem = div('field').withClass('field').appendTo(document.body).get();
    model.fieldElem = fieldElem;
}

function initCommands(model, robot) {
    robot.commandsElem = div(`${robot.id}-commands`).withClass(`robotCommands ${robot.id}`).appendTo(document.body).get();
}

function renderRobot(model, robot) {
    tile(robot.id, robot.x, robot.y, 'robot').rot(robot.dir * 90).appendTo(model.fieldElem);
}

function updateRobot(robots, callback) {
    robots.forEach((robot, index) => {
        const opts = {x:robot.x * tileSize, y:robot.y * tileSize, rotation:robot.dir * 90};
        if(index == 0) {
            opts.onComplete = callback;
        }
        TweenLite.to(div(robot.id).get(), 0.5, opts);
    });
}

function renderField(model) {
    model.tileData.forEach((tileRow, row) => {
        tileRow.forEach((tileId, col) => {
            tile(`tile${row}_${col}`, col, row, model.tiles[tileId]).appendTo(model.fieldElem);
        });
    });
    model.robots.forEach(robot => renderRobot(model, robot));
}

function renderCommands(model, robot, onSelect, onUnselect) {
    const commandsElem = div(robot.commandsElem.id).clear().get();

    robot.selectedCommands.forEach((command, index) => {
        const commandElem = commandCard(`${robot.id}-command-selected-${index}`, 'selected', command)
            .appendTo(commandsElem).get();
        commandElem.addEventListener('click', () => onUnselect(robot, command, index));
    });
    robot.availableCommands.forEach((command, index) => {
        const commandElem = commandCard(`${robot.id}-command-available-${index}`, 'available', command)
            .appendTo(commandsElem).get();
        commandElem.addEventListener('click', () => onSelect(robot, command, index));
    });
}
