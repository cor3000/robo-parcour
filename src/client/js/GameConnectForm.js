/* eslint-disable no-unused-vars */
import React from './fakeReact';
/* eslint-enable no-unused-vars */

export default class GameConnectForm {
    render(/*props, children*/) {
        return <form id="connect" action="#">
            <div>
                <label for="gameId">Game ID:</label>
                <input id="gameId" value="test123"/>
            </div>
            <div>
                <label for="label">Level:</label>
                <select id="levelId">
                    <option selected="selected">Test Level</option>
                    <option selected="selected">Level 1</option>
                </select>
            </div>
            <div>
                <label for="numCheckpoints">Checkpoints: </label>
                <input type="number" id="numCheckpoints" value="3"/>
            </div>
            <div>
                <button type="submit" id="connect">Create</button>
            </div>
        </form>;
    }
}


