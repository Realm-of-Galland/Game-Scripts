/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { Icon } from "./Icon";
import { DynamicValue } from "./DynamicValue";
import { Utils } from "../Common";

/** @class
 *  An element of the game.
 *  @extends System.Base
 *  @param {Record<string, any>} - [json=undefined] Json object describing the 
 *  element
 */
class Element extends Icon {

    public efficiency: DynamicValue[];

    constructor(json?: Record<string, any>) {
        super(json);
    }

    /** 
     *  Read the JSON associated to the element
     *  @param {Record<string, any>} - json Json object describing the element
     */
    read(json: Record<string, any>) {
        super.read(json);

        this.efficiency = [];
        Utils.readJSONSystemList({ list: json.e, listHash: this.efficiency, 
            cons: DynamicValue });
    }
}

export { Element }