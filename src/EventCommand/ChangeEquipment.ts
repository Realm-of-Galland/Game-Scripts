/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { Base } from "./Base";
import { System } from "../index";
import { Utils, Enum } from "../Common";
import { MapObject, Player, Item, Game } from "../Core";
import ItemKind = Enum.ItemKind;

/** @class
 *  An event command for changing a property value.
 *  @extends EventCommand.Base
 *  @param {any[]} command - Direct JSON command to parse
 */
class ChangeEquipment extends Base {

    public equipmentID: System.DynamicValue;
    public isWeapon: boolean;
    public weaponArmorID: System.DynamicValue;
    public selection: number;
    public heInstanceID: System.DynamicValue;
    public groupIndex: number;
    public isApplyInInventory: boolean;

    constructor(command: any[]) {
        super();

        let iterator = {
            i: 0
        };
        this.equipmentID = System.DynamicValue.createValueCommand(command, 
            iterator);
        this.isWeapon = Utils.numToBool(command[iterator.i++]);
        this.weaponArmorID = System.DynamicValue.createValueCommand(command, 
            iterator);

        // Selection
        this.selection = command[iterator.i++];
        switch (this.selection) {
            case 0:
                this.heInstanceID = System.DynamicValue.createValueCommand(
                    command, iterator);
                break;
            case 1:
                this.groupIndex = command[iterator.i++];
                break;
        }
        this.isApplyInInventory = Utils.numToBool(command[iterator.i++]);
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
        let equipmentID = this.equipmentID.getValue();
        let kind = this.isWeapon ? ItemKind.Weapon : ItemKind.Armor;
        let weaponArmorID = this.weaponArmorID.getValue();
        let targets: Player[];
        switch (this.selection) {
            case 0:
                targets = [Game.current.getHeroByInstanceID(this
                    .heInstanceID.getValue())];
                break;
            case 1:
                targets = Game.current.getTeam(this.groupIndex);
                break;
        }
        let target: Player, item: Item;
        for (let i = 0, l = targets.length; i < l; i++) {
            target = targets[i];
            item = Item.findItem(kind, weaponArmorID);
            if (item === null) {
                if (this.isApplyInInventory) {
                    break; // Don't apply because not in inventory
                }
                item = new Item(kind, weaponArmorID, 0);
            }
            if (target.equip[equipmentID] !== null) {
                target.equip[equipmentID].add(1);
            }
            target.equip[equipmentID] = item;
            if (this.isApplyInInventory) {
                item.remove(1);
            }
        }
        return 1;
    }
}

export { ChangeEquipment }
