/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { System, Datas } from "../index";
import { IO, Paths, Utils } from "../Common";

/** @class
 *  All the animations datas.
 *  @static
 */
class Animations {

    private static list: System.Animation[];

    constructor() {
        throw new Error("This is a static class!");
    }

    /** 
     *  Read the JSON file associated to status.
     *  @static
     *  @async
     */
    static async read() {
        let json = (await IO.parseFileJSON(Paths.FILE_ANIMATIONS)).animations;
        this.list = [];
        Utils.readJSONSystemList({ list: json, listIDs: this.list, cons: System
            .Animation });
    }

    /** 
     *  Get the animation by ID.
     *  @static
     *  @param {number} id
     *  @returns {System.Animation}
     */
    static get(id: number): System.Animation {
        return Datas.Base.get(id, this.list, "animation");
    }
}

export { Animations }