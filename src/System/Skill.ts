/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { Battler } from "../Core";
import { CommonSkillItem } from "./CommonSkillItem";

/** @class
 *  A skill of the game.
 *  @extends System.CommonSkillItem
 *  @param {Record<string, any>} - [json=undefined] Json object describing the 
 *  skill
 */
class Skill extends CommonSkillItem {

    constructor(json) {
        super(json);
    }

    /** 
     *  Read the JSON associated to the skill.
     *  @param {Record<string, any>} - json Json object describing the skill
     */
    read(json: Record<string, any>) {
        super.read(json);
    }

    /** 
     *  Get the string representation of costs.
     *  @returns {string}
     */
    getCostString(): string {
        let result = "";
        for (let i = 0, l = this.costs.length; i < l; i++) {
            result += this.costs[i].toString();
            if (i === l - 1) {
                result += " ";
            }
        }
        return result;
    }

    /** 
     *  Get message and replace user / skill name.
     *  @param {Battler} user
     *  @returns {string}
     */
    getMessage(user: Battler): string {
        return this.battleMessage.name().replace('[user]', user.player.name)
            .replace('[skill]', this.name());
    }
}

export { Skill }