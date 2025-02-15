/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { IO, Paths, Utils } from "../Common";
import { System, Datas } from "../index";

/** @class
 *  All the battle System datas.
 *  @static
 */
class CommonEvents {

    public static PROPERTY_STOCKED = "stocked";
    private static eventsSystem: System.Event[];
    private static eventsUser: System.Event[];
    private static commonReactions: System.CommonReaction[];
    private static commonObjects: System.MapObject[];

    constructor() {
        throw new Error("This is a static class!");
    }

    /** 
     *  Read the JSON file associated to common events.
     *  @static
     *  @async
     */
    static async read() {
        let json = await IO.parseFileJSON(Paths.FILE_COMMON_EVENTS);

        // Lists
        this.eventsSystem = [];
        this.eventsUser = [];
        this.commonReactions = [];
        this.commonObjects = [];
        Utils.readJSONSystemList({ list: json.eventsSystem, listIDs: this
            .eventsSystem, cons: System.CommonEvent });
        Utils.readJSONSystemList({ list: json.eventsUser, listIDs: this
            .eventsUser, cons: System.CommonEvent });
        Utils.readJSONSystemList({ list: json.commonReactors, listIDs: this
            .commonReactions, cons: System.CommonReaction });

        // Common objects
        /* First, we'll need to reorder the json list according to
        inheritance */
        let jsonObjects = json.commonObjects;
        let reorderedList = [];
        let jsonObject: Record<string, any>;
        for (let i = 0, l = jsonObjects.length; i < l; i++) {
            jsonObject = jsonObjects[i];
            this.modelReOrder(jsonObject, reorderedList, jsonObjects, l);
        }

        // Now, we can create all the models without problem
        Utils.readJSONSystemList({ list: reorderedList, listIDs: this
            .commonObjects, cons: System.MapObject });
    }

    /** 
     *  Reorder the models in the right order for inheritance.
     *  @param {Record<string, any>} - jsonObject The json corresponding to the 
     *  current object to analyze
     *  @pa Datasects
     *  @param {number} objectsLength - The number of objects to identify
     */
    static modelReOrder(jsonObject: Record<string, any>, reorderedList: 
        Record<string, any>[], jsonObjects: Record<string, any>[], objectsLength
        : number)
    {
        if (jsonObject && !jsonObject.hasOwnProperty(Datas.CommonEvents
            .PROPERTY_STOCKED))
        {
            // If id = -1, we can add to the list
            let id = jsonObject.hId;
            if (id !== -1) {
                // Search id in the json list
                let inheritedObject: Record<string, any>;
                for (let i = 0; i < objectsLength; i++) {
                    inheritedObject = jsonObjects[i];
                    if (inheritedObject.id === id) {
                        break;
                    }
                }
                // Test inheritance for this object
                this.modelReOrder(inheritedObject, reorderedList, jsonObjects,
                    objectsLength);
            }
            jsonObject.stocked = true;
            reorderedList.push(jsonObject);
        }
    }

    /** 
     *  Get the event system by ID.
     *  @param {number} id
     *  @returns {System.Event}
     */
    static getEventSystem(id: number): System.Event {
        return Datas.Base.get(id, this.eventsSystem, "event system");
    }

    /** 
     *  Get the event user by ID.
     *  @param {number} id
     *  @returns {System.Event}
     */
    static getEventUser(id: number): System.Event {
        return Datas.Base.get(id, this.eventsUser, "event user");
    }

    /** 
     *  Get the common reaction by ID.
     *  @param {number} id
     *  @returns {System.CommonReaction}
     */
    static getCommonReaction(id: number): System.CommonReaction {
        return Datas.Base.get(id, this.commonReactions, "common reaction");
    }

    /** 
     *  Get the common object by ID.
     *  @param {number} id
     *  @returns {System.MapObject}
     */
    static getCommonObject(id: number): System.MapObject {
        return Datas.Base.get(id, this.commonObjects, "common object");
    }
}

export { CommonEvents }