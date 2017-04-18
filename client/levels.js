import { nextId } from './render';

export const ROBOT = 'robot';
export const START = 'start';
export const CRATE = 'crate';
export const WALL = 'wall';
export const PIT = 'pit';
export const CHECKPOINT = 'checkpoint';
export const REPAIR = 'repair';
export const GEAR_LEFT_TURN = 'gearLeft';
export const GEAR_RIGHT_TURN = 'gearRight';
export const CONVEYOR = 'conveyor';
export const CONVEYOR_LEFT_TURN = 'conveyorLeft';
export const CONVEYOR_RIGHT_TURN = 'conveyorRight';
export const CONVEYOR_2 = 'conveyor2';
export const CONVEYOR_2_LEFT_TURN = 'conveyor2Left';
export const CONVEYOR_2_RIGHT_TURN = 'conveyor2Right';

const TILES = {
        0: 'empty',
        1: CRATE, 
        2: PIT, 
        3: `${WALL}-right`,
        4: `${WALL}-down`,
        5: `${WALL}-left`,
        6: `${WALL}-up`,
        14: 'spike',
        15: GEAR_LEFT_TURN,
        16: GEAR_RIGHT_TURN,
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

        50: `${CONVEYOR_2}-right`,
        51: `${CONVEYOR_2}-down`,
        52: `${CONVEYOR_2}-left`,
        53: `${CONVEYOR_2}-up`,
        54: `${CONVEYOR_2_LEFT_TURN}-right`,
        55: `${CONVEYOR_2_LEFT_TURN}-down`,
        56: `${CONVEYOR_2_LEFT_TURN}-left`,
        57: `${CONVEYOR_2_LEFT_TURN}-up`,
        58: `${CONVEYOR_2_RIGHT_TURN}-right`,
        59: `${CONVEYOR_2_RIGHT_TURN}-down`,
        60: `${CONVEYOR_2_RIGHT_TURN}-left`,
        61: `${CONVEYOR_2_RIGHT_TURN}-up`,
        90: `${START}-right`,
        91: `${START}-down`,
        92: `${START}-left`,
        93: `${START}-up`,
        94: CHECKPOINT,
        95: REPAIR,
    };

const DIRECTIONS = {
      right: 0,  
      down: 1,  
      left: 2,  
      up: 3
    };

const testLevelData = {
    items: {
        walls: [
            [ 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 3],
            [ 5, 1, 0, 0, 0, 3, 0, 0, 0, 0, 0, 3],
            [ 5, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 3],
            [ 5, 4, 0, 0, 0, 4, 0, 0, 0, 0, 3, 3],
            [ 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3],
            [ 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
            [ 5, 1, 0, 0, 0, 0, 3, 0, 0, 5, 0, 3],
            [ 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3]
        ], 
        items: [
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0,90, 0, 0, 0, 5,94, 0,95, 0, 0],
            [ 0, 0, 0, 0, 2,25,22,22,26, 4, 0,94],
            [ 0,90, 0,25,22,30,94,16,23,94, 0, 0],
            [ 0,90, 0,24,20,29, 2,15,23,16, 2, 0],
            [ 0, 0, 0, 0,15,24,20,20,27, 0, 0, 0],
            [ 0, 0,90, 0,95, 0, 0,94, 3, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,94, 0]
        ]
    }, 
    extraTiles : [
        {x: 0, y: 0, tileName: `${WALL}-up`},
        {x: 0, y: 7, tileName: `${WALL}-down`},
        {x: 11, y: 0, tileName: `${WALL}-up`},
        {x: 11, y: 7, tileName: `${WALL}-down`},
    ],
    dimensions : {width: 12, height: 8}
};

const level1Data = {
    items: {
        walls: [
            [ 0, 2, 6, 0, 6, 0, 0, 6, 0, 6, 0, 0],
            [ 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 5, 0, 0, 0, 0, 5, 3, 0, 0, 0, 0, 3],
            [ 0, 0, 0, 0, 6, 0, 0, 6, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 0],
            [ 5, 0, 0, 0, 0, 5, 3, 0, 0, 0, 0, 3],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 5, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 3],
            [ 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 4, 0, 4, 0, 0, 4, 0, 4, 0, 0]
        ], 
        items: [
            [ 0, 0, 0,23, 0, 0,23, 0,21, 0,23,95],
            [ 0, 0, 0,23, 0,21,23,94,21, 0, 0, 0],
            [90, 0, 0,23, 0,21,23, 0,21, 0, 0, 0],
            [20,20,20,15, 0,21,23, 0,15,20,20,20],
            [90, 0, 0, 0, 0,21,23, 0, 0, 0, 0, 0],
            [52,52,52,52,52, 0, 0,22,22,22,22,22],
            [ 0,20,20,20,20, 0, 0,20,20,20,20,20],
            [90, 0, 0, 0,95,51,23, 0, 0, 0,94, 0],
            [22,22,22,15, 0,51,23, 0,22,22,22,22],
            [90, 0, 0,23,94,51,23, 0,51, 0, 0, 0],
            [20,16, 0,23, 0,51,23, 0,51, 0,16,20],
            [95,21, 0,23, 0,51,23, 0,51, 0,23, 0]
        ]
    }, 
    extraTiles : [
     /*   {x: 0, y: 0, tileName: `${WALL}-up`},
        {x: 0, y: 7, tileName: `${WALL}-down`},
        {x: 11, y: 0, tileName: `${WALL}-up`},
        {x: 11, y: 7, tileName: `${WALL}-down`}*/
    ],
    dimensions : {width: 12, height: 12}
};


const levels = {
    'Test Level' : testLevelData,
    'Level 1' : level1Data
};

export function loadLevel(levelId) {
    const levelData = levels[levelId];
    const items = [];
    const createItem = ({x, y, tileName}) => {
        const typeAndDir = tileName.split('-');
        const type = typeAndDir[0];
        const dir = typeAndDir[1] ? DIRECTIONS[typeAndDir[1]] : 0;
        items.push({
            id: type + '-' + nextId(),
            type, x, y, dir
        });
    };
    for(let layer in levelData.items) {
        levelData.items[layer].forEach((row, y) => {
            row.forEach((tileId, x) => {
                if(tileId !== 0 /*empty*/) {
                    createItem({x, y, tileName: TILES[tileId]});
                }
            });
        });
    }
    levelData.extraTiles.forEach(createItem);
    return {items, dimensions: levelData.dimensions};
}

