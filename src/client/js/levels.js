import { nextId } from './render';

export const ITEM_TYPES = {
    ROBOT: 'robot',
    START: 'start',
    CRATE: 'crate',
    WALL: 'wall',
    PIT: 'pit',
    CHECKPOINT: 'checkpoint',
    REPAIR: 'repair',
    LASER: 'laser',
    GEAR_LEFT_TURN: 'gearLeft',
    GEAR_RIGHT_TURN: 'gearRight',
    CONVEYOR: 'conveyor',
    CONVEYOR_LEFT_TURN: 'conveyorLeft',
    CONVEYOR_RIGHT_TURN: 'conveyorRight',
    CONVEYOR_2: 'conveyor2',
    CONVEYOR_2_LEFT_TURN: 'conveyor2Left',
    CONVEYOR_2_RIGHT_TURN: 'conveyor2Right'
}

export const TILES = {
        0: 'empty',
        1: ITEM_TYPES.CRATE, 
        2: ITEM_TYPES.PIT, 
        3: `${ITEM_TYPES.WALL}-right`,
        4: `${ITEM_TYPES.WALL}-down`,
        5: `${ITEM_TYPES.WALL}-left`,
        6: `${ITEM_TYPES.WALL}-up`,
        7: `${ITEM_TYPES.LASER}-right`,
        8: `${ITEM_TYPES.LASER}-down`,
        9: `${ITEM_TYPES.LASER}-left`,
        10: `${ITEM_TYPES.LASER}-up`,
        14: 'spike',
        15: ITEM_TYPES.GEAR_LEFT_TURN,
        16: ITEM_TYPES.GEAR_RIGHT_TURN,
        20: `${ITEM_TYPES.CONVEYOR}-right`,
        21: `${ITEM_TYPES.CONVEYOR}-down`,
        22: `${ITEM_TYPES.CONVEYOR}-left`,
        23: `${ITEM_TYPES.CONVEYOR}-up`,
        24: `${ITEM_TYPES.CONVEYOR_LEFT_TURN}-right`,
        25: `${ITEM_TYPES.CONVEYOR_LEFT_TURN}-down`,
        26: `${ITEM_TYPES.CONVEYOR_LEFT_TURN}-left`,
        27: `${ITEM_TYPES.CONVEYOR_LEFT_TURN}-up`,
        28: `${ITEM_TYPES.CONVEYOR_RIGHT_TURN}-right`,
        29: `${ITEM_TYPES.CONVEYOR_RIGHT_TURN}-down`,
        30: `${ITEM_TYPES.CONVEYOR_RIGHT_TURN}-left`,
        31: `${ITEM_TYPES.CONVEYOR_RIGHT_TURN}-up`,

        50: `${ITEM_TYPES.CONVEYOR_2}-right`,
        51: `${ITEM_TYPES.CONVEYOR_2}-down`,
        52: `${ITEM_TYPES.CONVEYOR_2}-left`,
        53: `${ITEM_TYPES.CONVEYOR_2}-up`,
        54: `${ITEM_TYPES.CONVEYOR_2_LEFT_TURN}-right`,
        55: `${ITEM_TYPES.CONVEYOR_2_LEFT_TURN}-down`,
        56: `${ITEM_TYPES.CONVEYOR_2_LEFT_TURN}-left`,
        57: `${ITEM_TYPES.CONVEYOR_2_LEFT_TURN}-up`,
        58: `${ITEM_TYPES.CONVEYOR_2_RIGHT_TURN}-right`,
        59: `${ITEM_TYPES.CONVEYOR_2_RIGHT_TURN}-down`,
        60: `${ITEM_TYPES.CONVEYOR_2_RIGHT_TURN}-left`,
        61: `${ITEM_TYPES.CONVEYOR_2_RIGHT_TURN}-up`,
        90: `${ITEM_TYPES.START}-right`,
        91: `${ITEM_TYPES.START}-down`,
        92: `${ITEM_TYPES.START}-left`,
        93: `${ITEM_TYPES.START}-up`,
        94: ITEM_TYPES.CHECKPOINT,
        95: ITEM_TYPES.REPAIR,
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
        {x: 0, y: 0, tileName: `${ITEM_TYPES.WALL}-up`},
        {x: 0, y: 7, tileName: `${ITEM_TYPES.WALL}-down`},
        {x: 11, y: 0, tileName: `${ITEM_TYPES.WALL}-up`},
        {x: 11, y: 7, tileName: `${ITEM_TYPES.WALL}-down`},
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
            [95,21, 0,23, 0,51,23, 0,51,10,23, 0]
        ]
    }, 
    extraTiles : [
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

