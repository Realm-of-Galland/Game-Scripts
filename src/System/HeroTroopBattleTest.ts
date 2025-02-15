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
import { Player } from "../Core";
import { Base } from "./Base";

/** @class
 *  An hero troop battle test.
 *  @extends System.Base
 *  @param {Record<string, any>} - [json=undefined] Json object describing the 
 *  hero
 */
class HeroTroopBattleTest extends Base {

    public heroID: number;
    public level: number;
    public equipments: System.HeroTroopBattleTestEquipment[];

    constructor(json?: Record<string, any>) {
        super(json);
    }

    /** 
     *  Read the JSON associated to the hero.
     *  @param {Record<string, any>} - json Json object describing the hero
     */
    read(json: Record<string, any>) {
        this.heroID = Utils.defaultValue(json.heroID, 1);
        this.level = Utils.defaultValue(json.level, 1);
        this.equipments = [];
        Utils.readJSONSystemList({ list: json.equipments, listIndexes: this
            .equipments, cons: System.HeroTroopBattleTestEquipment });
    }

    /** 
     *  Equip the equipments to a player.
     *  @param {Player} player
     */
    equip(player: Player) {
        for (let equipment of this.equipments) {
            equipment.equip(player);
        }
    }
}

export { HeroTroopBattleTest }