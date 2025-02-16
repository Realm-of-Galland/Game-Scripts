/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { System } from "..";
import { Utils } from "../Common";
import { Game } from "../Core";
import { Base } from "./Base";

/** @class
 *  A random battle of the game.
 *  @extends System.Base
 *  @param {Record<string, any>} - [json=undefined] Json object describing the 
 *  random battle
 */
class RandomBattle extends Base {
    public troopID: System.DynamicValue;
    public priority: System.DynamicValue;
    public isEntireMap: boolean;
    public terrains: System.DynamicValue[];
    public currentPriority: number;
    public currentNumberSteps: number;

    constructor(json?: Record<string, any>) {
        super(json);
    }

    /** 
     *  Read the JSON associated to random battle.
     *  @param {Record<string, any>} - json Json object describing the random 
     *  battle
     */
    read(json: Record<string, any>) {
        this.troopID = System.DynamicValue.readOrDefaultDatabase(json.troopID);
        this.priority = System.DynamicValue.readOrDefaultNumber(json.priority, 10);
        this.isEntireMap = Utils.defaultValue(json.isEntireMap, true);
        this.terrains = [];
        if (!this.isEntireMap) {
            Utils.readJSONSystemList({ list: json.terrains, listIndexes: this
                .terrains, func: (obj: Record<string, any>) => {
                    return System.DynamicValue.readOrDefaultNumber(obj.value);
                }
            });
        }
        this.resetCurrentNumberSteps();
    }

    /** 
     *  Update the current priority value.
     */
    updateCurrentPriority() {
        this.currentPriority = this.priority.getValue();
    }

    /** 
     *  Update the current number of steps for this random battle.
     */
    updateCurrentNumberSteps() {
        if (this.isEntireMap) {
            this.currentNumberSteps++;
        } else {
            for (let terrain of this.terrains) {
                if (Game.current.hero.terrain === terrain.getValue()) {
                    this.currentNumberSteps++;
                    break;
                }
            }
        }
    }

    /** 
     *  Reset the current number of steps for this random battle.
     */
    resetCurrentNumberSteps() {
        this.currentNumberSteps = 0;
    }
}

export { RandomBattle }