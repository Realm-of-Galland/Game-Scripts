/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { Base } from "./Base";
import { System, Graphic, Datas, Scene } from "../index";
import { ScreenResolution, Enum, Constants } from "../Common";
import { WindowChoices, MapObject, WindowBox } from "../Core";
import Align = Enum.Align;
import { ShowText } from "./ShowText";

/** @class
 *  An event command for displaying a choice.
 *  @extends EventCommand.Base
 *  @param {any[]} command - Direct JSON command to parse
 */
class DisplayChoice extends Base {

    public cancelAutoIndex: System.DynamicValue;
    public maxNumberChoices: System.DynamicValue;
    public choices: string[];
    public windowChoices: WindowChoices;
    public showText: ShowText;
    public graphics: Graphic.Text[];
    public maxWidth: number;

    constructor(command: any[]) {
        super();

        let iterator = {
            i: 0
        };
        this.cancelAutoIndex = System.DynamicValue.createValueCommand(command, 
            iterator);
        this.maxNumberChoices = System.DynamicValue.createValueCommand(command, 
            iterator);
        this.choices = [];
        let l = command.length;
        let lang: System.Translatable = null;
        let next: string;
        while (iterator.i < l) {
            next = command[iterator.i];
            if (next === Constants.STRING_DASH) {
                iterator.i++;
                if (lang !== null) {
                    this.choices.push(lang.name());
                }
                lang = new System.Translatable();
            } else {
                lang.getCommand(command, iterator);
            }
        }
        if (lang !== null) {
            this.choices.push(lang.name());
        }

        // Determine slots width
        l = this.choices.length;
        this.graphics = new Array(l);
        this.maxWidth = WindowBox.MEDIUM_SLOT_WIDTH;
        let graphic: Graphic.Text;
        for (let i = 0; i < l; i++) {
            graphic = new Graphic.Text(this.choices[i], { align: Align.Center });
            this.graphics[i] = graphic;
            if (graphic.textWidth > this.maxWidth) {
                this.maxWidth = graphic.textWidth;
            }
        }
        this.maxWidth += WindowBox.SMALL_SLOT_PADDING[0] + WindowBox.SMALL_SLOT_PADDING[2];
    }

    /** 
     *  Set the show text property.
     *  @param {EventCommand.ShowText} showText - The show text value
     */
    setShowText(showText: ShowText) {
        this.showText = showText;
    }

    /** 
     *  An event action.
     *  @param {Record<string ,any>} currentState
     *  @param {boolean} isKey
     *  @param {{ key?: number, x?: number, y?: number }} [options={}]
     */
    action(currentState: Record<string ,any>, isKey: boolean, options: { key?: 
        number, x?: number, y?: number } = {}) {
        if (Scene.MenuBase.checkActionMenu(isKey, options)) {
            Datas.Systems.soundConfirmation.playSound();
            currentState.index = this.windowChoices.currentSelectedIndex;
        } else if (Scene.MenuBase.checkCancel(isKey, options)) {
            Datas.Systems.soundCancel.playSound();
            currentState.index = this.cancelAutoIndex.getValue() - 1;
        }
    }

    /** 
     *  An event move.
     *  @param {Record<string ,any>} currentState
     *  @param {boolean} isKey
     *  @param {{ key?: number, x?: number, y?: number }} [options={}]
     */
    move(currentState: Record<string ,any>, isKey: boolean, options: { key?: 
        number, x?: number, y?: number } = {}) {
        this.windowChoices.move(isKey, options);
    }

    /** 
     *  Initialize the current state.
     *  @returns {Record<string, any>} The current state
     */
    initialize(): Record<string, any> {
        let maxItems = this.maxNumberChoices.getValue();
        this.windowChoices = new WindowChoices((ScreenResolution.SCREEN_X - this
            .maxWidth) / 2, ScreenResolution.SCREEN_Y - 10 - 150 - (Math.min(this
            .choices.length, maxItems) * WindowBox.MEDIUM_SLOT_HEIGHT), this
            .maxWidth, WindowBox.MEDIUM_SLOT_HEIGHT, this.graphics,
            {
                nbItemsMax: maxItems
            }
        );
        // Move to right if show text before
        if (this.showText) {
            this.windowChoices.setX(ScreenResolution.SCREEN_X - this
                .windowChoices.oW - 10);
        }
        return {
            index: -1
        };
    }

    /** 
     *  Update and check if the event is finished.
     *  @param {Record<string, any>}} - currentState The current state of the 
     *  event
     *  @param {MapObject} object - The current object reacting
     *  @param {number} state - The state ID
     *  @returns {number} The number of node to pass
     */
    update(currentState: Record<string, any>, object: MapObject, state: number): 
        number {
        this.windowChoices.update();
        return currentState.index + 1;
    }

    /** 
     *  Returns the number of node to pass.
     *  @returns {number}
     */
    goToNextCommand(): number {
        return 1;
    }

    /** 
     *  First key press handle for the current stack.
     *  @param {Record<string, any>} - currentState The current state of the event
     *  @param {number} key - The key ID pressed
     */
    onKeyPressed(currentState: Record<string, any>, key: number) {
        this.action(currentState, true, { key: key });
    }

    /** 
     *  Key pressed repeat handle for the current stack, but with
     *  a small wait after the first pressure (generally used for menus).
     *  @param {Record<string, any>}} - currentState The current state of the event
     *  @param {number} key - The key ID pressed
     */
    onKeyPressedAndRepeat(currentState: Record<string, any>, key: number): 
        boolean {
        this.move(currentState, true, { key: key });
        return true;
    }

    /** 
     *  @inheritdoc
     */
    onMouseMove(currentState: Record<string, any>, x: number, y: number) {
        this.move(currentState, false, { x: x, y: y });
    }

    /** 
     *  @inheritdoc
     */
    onMouseUp(currentState: Record<string, any>, x: number, y: number) {
        this.action(currentState, false, { x: x, y: y });
    }

    /** 
     *  Draw the HUD
     *  @param {Record<string, any>} - currentState The current state of the event
     */
    drawHUD(currentState?: Record<string, any>) {
        // Display text command if existing
        if (this.showText) {
            this.showText.drawHUD();
        }
        this.windowChoices.draw();
    }
}

export { DisplayChoice }