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

function renderField(model) {
    model.tileData.forEach((tileRow, row) => {
        tileRow.forEach((tileId, col) => {
            tile(`tile${row}_${col}`, col, row, model.tiles[tileId]).appendTo(model.fieldElem);
        });
    });
    model.robots.forEach(robot => renderRobot(model, robot));
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
            robot.availableCommands.unshift(command);
            renderCommands(model, robot);
        });
    });
}
