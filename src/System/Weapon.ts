/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { Armor } from "./Armor";
import { Datas, System } from "../index";
import { Enum } from "../Common";

/** @class
 *  A weapon of the game.
 *  @extends System.Armor
 *  @param {Record<string, any>} - [json=undefined] Json object describing the 
 *  weapon
 */
class Weapon extends Armor {

    constructor(json?: Record<string, any>) {
        super(json);
    }

    /** 
     *  Read the JSON associated to the weapon.
     *  @param {Record<string, any>} - json Json object describing the weapon
     */
    read(json: Record<string, any>) {
        super.read(json);
    }
    
    /** 
     *  Get the weapon kind.
     *  @returns {System/WeaponArmorKind}
     */
    getType(): System.WeaponArmorKind {
        return Datas.BattleSystems.getWeaponKind(this.type);
    }

    /** 
     *  Get the item kind.
     *  @returns {Enum.ItemKind}
     */
    getKind(): Enum.ItemKind {
        return Enum.ItemKind.Weapon;
    }
}

export { Weapon }