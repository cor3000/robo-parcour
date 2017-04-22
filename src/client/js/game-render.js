import { TweenLite, TimelineLite, Sine }  from 'gsap';

import { div } from './render';
import { ITEM_TYPES } from './levels';


const NO_DELAY = 0;
const tileSize = 50;
const animationDuration = 0.5;

function tile(id, x, y, tileClass) {
    return div(id).size(tileSize, tileSize).atPos(x * tileSize, y * tileSize).withClass(`tile ${tileClass}`);
}

export function initField(model) {
    const {width, height} = model.dimensions;
    const fieldElem = div('field').withClass('field').appendTo(document.body).size(width * tileSize, height * tileSize).get();
    const wallsElem = div('walls').withClass('walls shadows').appendTo(fieldElem).get();
    const itemsElem = div('items').withClass('items shadows').appendTo(fieldElem).get();
    model.fieldElemId = fieldElem.id;
    model.wallsElemId = wallsElem.id;
    model.itemsElemId = itemsElem.id;
}

export function renderRobot(model, robot) {
    tile(robot.id, robot.x, robot.y, 'robot')
        .rot(robot.dir * 90)
        .appendTo(div(model.itemsElemId).get());
}

export function updateRobot(robots) {
    return new Promise(resolve => {
        const anim = new TimelineLite({onComplete: resolve});
        robots.forEach((robot) => {
            const opts = {
                    x: robot.x * tileSize, 
                    y: robot.y * tileSize, 
                    rotation: robot.dir * 90,
                    ease: Sine.easeInOut
                   };
            anim.add(TweenLite.to(div(robot.id).get(), animationDuration, opts), NO_DELAY);
        });
    });
}

export function animateConveyors() {
    _animateConveyors('.conveyor');
}
export function animateConveyors2() {
    _animateConveyors('.conveyor2');
}

function _animateConveyors(conveyorSelector) {
    TweenLite.to(conveyorSelector, animationDuration, {
        backgroundPositionX: tileSize,
        ease: Sine.easeInOut,
        onComplete: () => TweenLite.set(conveyorSelector, {backgroundPositionX: 0})
    });
    TweenLite.to(`${conveyorSelector}Left > .bg`, animationDuration, {
        rotation: -90,
        ease: Sine.easeInOut,
        onComplete: () => TweenLite.set(`${conveyorSelector}Left > .bg`, {rotation: 0})
    });
    TweenLite.to(`${conveyorSelector}Right > .bg`, animationDuration, {
        rotation: 90,
        ease: Sine.easeInOut,
        onComplete: () => TweenLite.set(`${conveyorSelector}Right > .bg`, {rotation: 0})
    });
}

export function animateGears() {
    TweenLite.to('.gearLeft', animationDuration, {
        rotation: '-=90',
        ease: Sine.easeInOut
    });
    TweenLite.to('.gearRight', animationDuration, {
        rotation: '+=90',
        ease: Sine.easeInOut
    });
}

export function animatePitDeath(robots) {
    return new Promise(resolve => {
        if(robots.length) {
            TweenLite.to(robots.map(r => div(r.id).get()), 1.5, {
                scale: 0.2, opacity: 0.0, rotation: '+=720', 
                onComplete: resolve
            });
        } else resolve();
    });
}

export function animateEnergyDeath(robots) {
    return new Promise(resolve => {
        if(robots.length) {
            TweenLite.to(robots.map(r => div(r.id).get()), 1.5, {
                scale: 1.5, opacity: 0.0, rotation: '+=360',
                onComplete: resolve
            });
        } else resolve();
    });
}

export function animateRespawn(robots) {
    if(robots.length === 0) return Promise.resolve();
    return new Promise(resolve => {
        const anim = new TimelineLite({onComplete: resolve});
        robots.forEach((robot) => {
            const robotDiv = div(robot.id).get();
            anim.add(TweenLite.set(robotDiv, {scale: 2, opacity: 0}), NO_DELAY);
            const opts = {
                x: robot.x * tileSize, 
                y: robot.y * tileSize, 
                rotation: robot.dir * 90,
                scale: 1, 
                opacity: 1 
            };
            anim.add(TweenLite.to(div(robot.id).get(), 1.5, opts), NO_DELAY);
        });

    });
}

export function animateLaserFire(model, shots) {
    return new Promise((resolve) => {
        const anim = new TimelineLite({onComplete: resolve});
        shots.forEach((shot, index) => {
            const fx = shot.from.x;
            const fy = shot.from.y;
            const tx = shot.to.x;
            const ty = shot.to.y;
            const vx = shot.vec.x;
            const vy = shot.vec.y;
            
            const isFromLaser = shot.from.type === ITEM_TYPES.LASER;
            const isFromRobot = shot.from.type === ITEM_TYPES.ROBOT;
            const isToRobot = shot.to.type === ITEM_TYPES.ROBOT;
            
            let startOffset = 0;
            if(isFromRobot) startOffset = 0.90;
            if(isFromLaser) startOffset = 0.15;
            let endOffset = 0;
            if(isToRobot) endOffset = 0.5;
            
            const length = Math.abs((tx - fx) * vx + (ty - fy) * vy) - startOffset - endOffset + 1;
            const startX = fx + startOffset * vx;
            const startY = fy + startOffset * vy;
            
            const beam = tile(`beam${index}`, startX, startY, 'beam' + (isFromLaser ? ' beam-wall' : '')).appendTo(div(model.fieldElemId).get()).get();

            TweenLite.set(beam, {
                rotation: shot.from.dir * 90,
                x: (startX + (length * 0.5 - 0.5) * vx) * tileSize,
                y: (startY + (length * 0.5 - 0.5) * vy) * tileSize,
                scaleX: length
            });
            const opts = {
                opacity: 0,
                onComplete: () => { beam.parentElement.removeChild(beam); }
            };
            anim.add(TweenLite.to(beam, animationDuration, opts), NO_DELAY);
        });
    });
}

export function renderField(model) {
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
        if(type === ITEM_TYPES.CHECKPOINT && item.index >= 0) {
            fieldTile.attr('data-checkpoint-index', item.index + 1);
        }

        if(type === ITEM_TYPES.WALL || type === ITEM_TYPES.CRATE || type === ITEM_TYPES.LASER) {
            fieldTile.appendTo(wallsElem);
        } else if(type === ITEM_TYPES.PIT || type === ITEM_TYPES.START) {
            fieldTile.insertBefore(fieldElem, wallsElem);
        } else {
            fieldTile.appendTo(itemsElem);
        }
        if(item.type === ITEM_TYPES.CONVEYOR_LEFT_TURN || item.type === ITEM_TYPES.CONVEYOR_RIGHT_TURN) {
            div(domId + '-bg').withClass('bg').appendTo(fieldTile.get());
        }
    });
    model.robots.forEach(robot => renderRobot(model, robot));
}

