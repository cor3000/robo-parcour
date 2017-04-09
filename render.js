const tileSize = 50;
const animationDuration = 0.5;

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
            TweenLite.set(elem, {x:x, y:y});
            return ops;
        },

        rot: (angle) => {
            TweenLite.set(elem, {rotation:angle})            
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

        insertBefore: (parent, before) => {
            if(parent !== elem.parent) {
                parent.insertBefore(elem, before);
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
    const wallsElem = div('walls').withClass('walls').appendTo(fieldElem).get();
    const itemsElem = div('items').withClass('items').appendTo(fieldElem).get();
    model.fieldElemId = fieldElem.id;
    model.wallsElemId = wallsElem.id;
    model.itemsElemId = itemsElem.id;
}

function initCommands(model, robot) {
    robot.commandsElem = div(`${robot.id}-commands`).withClass(`robotCommands ${robot.id}`).appendTo(document.body).get();
}

function renderRobot(model, robot) {
    tile(robot.id, robot.x, robot.y, 'robot')
        .rot(robot.dir * 90)
        .appendTo(div(model.itemsElemId).get());
}

function updateRobot(robots) {
    return new Promise((resolve, reject) => {
        const anim = new TimelineLite({onComplete: resolve});
        robots.forEach((robot, index) => {
            const opts = {
                    x: robot.x * tileSize, 
                    y: robot.y * tileSize, 
                    rotation: robot.dir * 90,
                    ease: Sine.easeInOut
                   };
            anim.add(TweenLite.to(div(robot.id).get(), animationDuration, opts), 0);
        });
    });
}

function animateConveyors() {
    TweenLite.to('.conveyor', animationDuration, {
        backgroundPositionX: tileSize,
        ease: Sine.easeInOut,
        onComplete: () => TweenLite.set('.conveyor', {backgroundPositionX: 0})
    });
    TweenLite.to('.conveyorLeft > .bg', animationDuration, {
        rotation: -90,
        ease: Sine.easeInOut,
        onComplete: () => TweenLite.set('.conveyorLeft > .bg', {rotation: 0})
    });
    TweenLite.to('.conveyorRight > .bg', animationDuration, {
        rotation: 90,
        ease: Sine.easeInOut,
        onComplete: () => TweenLite.set('.conveyorRight > .bg', {rotation: 0})
    });
}

function animateGears() {
    TweenLite.to('.gearLeft', animationDuration, {
        rotation: '-=90',
        ease: Sine.easeInOut
    });
    TweenLite.to('.gearRight', animationDuration, {
        rotation: '+=90',
        ease: Sine.easeInOut
    });
}

function animatePitDeath(robots) {
    return new Promise((resolve, reject) => {
        if(robots.length) {
            TweenLite.to(robots.map(r => div(r.id).get()), 1.5, {
                scale: 0.2, opacity: 0.5, rotation: '+=720', 
                onComplete: resolve
            });
        } else resolve();
    });
}

function animateEnergyDeath(robots) {
    return new Promise((resolve, reject) => {
        if(robots.length) {
            TweenLite.to(robots.map(r => div(r.id).get()), 1.5, {
                scale: 1.5, opacity: 0.5, rotation: '+=360',
                onComplete: resolve
            });
        } else resolve();
    });
}

function animateRespawn(robots, callback) {
    robots.forEach((robot, index) => {
        const robotDiv = div(robot.id).get();
        TweenLite.set(robotDiv, {scale: 2, opacity: 0});
        const opts = {
            x: robot.x * tileSize, 
            y: robot.y * tileSize, 
            rotation: robot.dir * 90,
            scale: 1, 
            opacity: 1 
        };
        if(index == 0) {
            opts.onComplete = callback;
        }
        TweenLite.to(div(robot.id).get(), 1.5, opts);
    });
}

function animateLaserFire(model, shots, callback) {
    shots.forEach((shot, index) => {
        const beam = tile(`beam${index}`, shot.from.x + shot.vec.x * 0.5, shot.from.y + shot.vec.y * 0.5, 'beam')
            .appendTo(div(model.itemsElemId).get()).get();

        const isCrate = shot.to.type === CRATE;
        const isShort = shot.distance <= 1;
        TweenLite.set(beam, {
            rotation: shot.from.dir * 90,
            scaleX: isShort ? (isCrate ? 0.1 : 0.5) : 1
        });
        const opts = {
            x: (shot.to.x - shot.vec.x * (isCrate && !isShort ? 1 : 0.5)) * tileSize,
            y: (shot.to.y - shot.vec.y * (isCrate && !isShort ? 1 : 0.5)) * tileSize
        };
        if(index === 0) {
            opts.onComplete = () => {
                beam.parentElement.removeChild(beam);
                callback();
            }
        } else {
            opts.onComplete = () => {
                beam.parentElement.removeChild(beam);
            };
        }
        TweenLite.to(beam, animationDuration, opts);
    });
};

function renderField(model) {
    const fieldElem = div(model.fieldElemId).get();
    const itemsElem = div(model.itemsElemId).get();
    const wallsElem = div(model.wallsElemId).get();
    model.items.forEach(item => {
        const col = item.x;
        const row = item.y;
        const type = item.type;
        const domId = `tile_${type}_${item.id}`;
        const styleClass = type + 
            (item.ownerId ? ` ${item.ownerId}` : '');
        const fieldTile = tile(domId, col, row, styleClass)
            .rot(item.dir * 90);
        if(type === CHECKPOINT && item.index >= 0) {
            fieldTile.attr('data-checkpoint-index', item.index + 1);
        }

        if(type === WALL || type === CRATE) {
            fieldTile.appendTo(wallsElem);
        } else if(type === PIT || type === START) {
            fieldTile.insertBefore(fieldElem, wallsElem);
        } else {
            fieldTile.appendTo(itemsElem);
        }
        if(item.type === CONVEYOR_LEFT_TURN || item.type === CONVEYOR_RIGHT_TURN) {
            div(domId + '-bg').withClass('bg').appendTo(fieldTile.get());
        }
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
