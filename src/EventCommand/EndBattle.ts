/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { Base } from "./Base";
import { MapObject } from "../Core";
import { Scene } from "../index";
import { Enum } from "../Common";

/** @class
 *  An event command for ending the battle.
 *  @extends EventCommand.Base
*/
class EndBattle extends Base {

    constructor(command: any[]) {
        super();
    }

    /** 
     *  Update and check if the event is finished.
     *  @param {Record<string, any>} - currentState The current state of the event
     *  @param {MapObject} object - The current object reacting
     *  @param {number} state - The state ID
     *  @returns {number} The number of node to pass
     */
    update(currentState: Record<string, any>, object: MapObject, state: number): 
        number
    {
        (<Scene.Battle>Scene.Map.current).forceEndBattle = true;
        return 1;
    }
}

export { EndBattle }