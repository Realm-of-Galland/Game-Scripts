/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { Datas, Graphic } from "..";
import { IO, Paths, Utils } from "../Common";

/** 
 *  @class
 *  All the languages datas.
 *  @static
 */
class Languages {

    private static list: string[];
    public static listOrder: number[];

    constructor() {
        throw new Error("This is a static class!");
    }

    /** 
     *  Read the JSON file associated to languages.
     *  @static
     *  @async
     */
    static async read() {
        let json = (await IO.parseFileJSON(Paths.FILE_LANGS)).langs;
        this.list = [];
        this.listOrder = [];
        Utils.readJSONSystemList({ list: json, listIDs: this.list, listIndexes: 
            this.listOrder, indexesIDs: true, func: (element: Record<string, any>) => {
            return element.name;
        }});
    }

    /** 
     *  Get the main language ID.
     *  @static
     *  @returns {number}
     */
    static getMainLanguageID(): number {
        return this.listOrder[0];
    }

    /** 
     *  Get the language name by ID.
     *  @static
     *  @param {number} id
     *  @returns {System.Monster}
     */
    static get(id: number): string {
        return Datas.Base.get(id, this.list, "language");
    }

    /** 
     *  Get the index according to language ID.
     *  @static
     *  @param {number} id
     *  @returns {number}
     */
    static getIndexByID(id: number): number {
        return this.listOrder.indexOf(id);
    }

    /** 
     *  Get the language graphics.
     *  @static
     *  @returns {Graphic.Text[]}
     */
    static getCommandsGraphics(): Graphic.Text[] {
        return this.listOrder.map(id => new Graphic.Text(this.get(id)));
    }

    /** 
     *  Get the language callbacks.
     *  @static
     *  @returns {(() => boolean)[]}
     */
    static getCommandsCallbacks(): (() => boolean)[] {
        return this.listOrder.map(id => (() => { return true; }));
    }
}

export { Languages }