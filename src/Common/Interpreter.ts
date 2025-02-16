/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { Datas, Common, Core, EventCommand, Graphic, Manager, System, Scene } from "../index";
import { Player, MapObject } from "../Core";
import { THREE, Howl } from "../Globals";

/**
 *  The interpreter to evaluate formulas or simple scripts without having to import.
 * @class Interpreter
 */
class Interpreter {

    private static common: typeof Common = Common;
    private static core: typeof Core = Core;
    private static datas: typeof Datas = Datas;
    private static eventCommand: typeof EventCommand = EventCommand;
    private static graphic: typeof Graphic = Graphic;
    private static manager: typeof Manager = Manager;
    private static scene: typeof Scene = Scene;
    private static system: typeof System = System;
    private static three: typeof THREE = THREE;
    private static howl: typeof Howl = Howl;

    constructor() {
        throw new Error("This is a static class");
    }

    /** 
     *  Evaluate a formula.
     */
    static evaluate(formula: string, { user, target, damage, thisObject, 
        addReturn = true, additionalName = "", additionalValue = null, 
        defaultValue = true }: { user?: Player, target?: Player, damage?: number, 
        thisObject?: MapObject, addReturn?: boolean, additionalName?: string, 
        additionalValue?: any, defaultValue?: any} = {}): any {
        if (formula === null) {
            return defaultValue;
        }
        return new Function("Common", "Core", "Datas", "EventCommand", "Graphic"
            , "Manager", "Scene", "System", "THREE", "Howl", "u", "t", "damage",
            "$object", additionalName, (addReturn ? "return " : "") + formula)(
            this.common, this.core, this.datas, this.eventCommand, this.graphic,
            this.manager, this.scene, this.system, this.three, this.howl, user, 
            target, damage, thisObject, additionalValue);
    }
}

export { Interpreter }