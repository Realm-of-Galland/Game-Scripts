/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { System } from "..";
import { Enum, Utils } from "../Common";
import { Base } from "./Base";

/** @class
 *  A possible status release turn condition hero.
 *  @extends System.Base
 *  @param {Record<string, any>} - json Json object describing the object state
 */
class StatusReleaseTurn extends Base {

    public operationTurnKind: Enum.OperationKind;
    public turn: System.DynamicValue;
    public chance: System.DynamicValue;

    constructor(json?: Record<string, any>)
    {
        super(json);
    }

    /** 
     *  Read the JSON associated to the status release turn.
     *  @param {Record<string, any>} - json Json object describing the status 
     *  release turn
     */
    read(json: Record<string, any>)
    {
        this.operationTurnKind = Utils.defaultValue(json.operationTurnKind, Enum
            .OperationKind.GreaterThanOrEqualTo);
        this.turn = System.DynamicValue.readOrDefaultNumber(json.turn, 1);
        this.chance = System.DynamicValue.readOrDefaultNumberDouble(json.chance);
    }
}

export { StatusReleaseTurn }