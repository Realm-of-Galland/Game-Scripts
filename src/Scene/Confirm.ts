/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { Graphic, Manager, Scene } from "../index";
import { Enum, ScreenResolution } from "../Common";
import { Rectangle, WindowBox, WindowChoices } from "../Core";
import { Base } from "./Base";

/** 
 * @class
 * A class for displaying a confirmation box and choice yes / no.
 */
class Confirm extends Base {

    public windowBoxConfirm: WindowBox;
    public windowChoicesConfirm: WindowChoices;
    public callback: () => void;

    constructor(callback: () => void) {
        super();
        this.callback = callback;
    }

    /**
     *  Create scene.
     */
    create() {
        this.createAllWindows();
    }

    /**
     *  Create all the windows in the scene.
     */
    createAllWindows() {
        this.createWindowBoxConfirm();
        this.createWindowChoicesConfirm();
    }

    /** 
     *  Create the window confirmation.
     */
    createWindowBoxConfirm() {
        const width = 200;
        const height = 75;
        const rect = new Rectangle((ScreenResolution.SCREEN_X - width) / 2, (
            ScreenResolution.SCREEN_Y - height) / 2, width, height);
        const graphic = new Graphic.Text("Confirm?", { align: Enum.Align.Center });
        const options = { 
            content: graphic
        };
        this.windowBoxConfirm = new WindowBox(rect.x, rect.y, rect.width, rect
            .height, options);
    }

    /** 
     *  Create the window information on top.
     */
    createWindowChoicesConfirm() {
        const rect = new Rectangle(this.windowBoxConfirm.oX + ((this
            .windowBoxConfirm.oW - WindowBox.SMALL_SLOT_WIDTH) / 2), this
            .windowBoxConfirm.oY + this.windowBoxConfirm.oH, WindowBox
            .SMALL_SLOT_WIDTH, WindowBox.SMALL_SLOT_HEIGHT);
        const options = {
            listCallbacks: [
                () => { // YES
                    Manager.Stack.pop();
                    this.callback.call(Manager.Stack.top);
                    this.callback = null;
                    return true;
                },
                () => { // NO
                    Manager.Stack.pop();
                    return false;
                }
            ]
        };
        const graphics = [
            new Graphic.Text("Yes", { align: Enum.Align.Center }),
            new Graphic.Text("No", { align: Enum.Align.Center })
        ];
        this.windowChoicesConfirm = new WindowChoices(rect.x, rect.y, rect.width, 
            rect.height, graphics, options);
    }

    /** 
     *  Slot action.
     *  @param {boolean} isKey
     *  @param {{ key?: number, x?: number, y?: number }} [options={}]
     */
    action(isKey: boolean, options: { key?: number, x?: number, y?: number } = {}) {
        if (Scene.MenuBase.checkActionMenu(isKey, options)) {
            if (isKey) {
                this.windowChoicesConfirm.onKeyPressed(options.key);
            } else {
                this.windowChoicesConfirm.onMouseUp(options.x, options.y);
            }
        }
    }

    /** 
     *  Slot move.
     *  @param {boolean} isKey
     *  @param {{ key?: number, x?: number, y?: number }} [options={}]
     */
    move(isKey: boolean, options: { key?: number, x?: number, y?: number } = {}) {
        this.windowChoicesConfirm.move(isKey, options);
    }

    /** 
     *  Handle scene key pressed.
     *   @param {number} key - The key ID
     */
    onKeyPressed(key: number) {
        this.action(true, { key: key });
    }

    /** 
     *  @inheritdoc
     */
    onMouseUp(x: number, y: number) {
        this.action(false, { x: x, y: y });
    }

    /** 
     *  Handle scene pressed and repeat key.
     *  @param {number} key - The key ID
     *  @returns {boolean}
     */
    onKeyPressedAndRepeat(key: number): boolean {
        this.move(true, { key: key });
        return true;
    }

    /** 
     *  @inheritdoc
     */
    onMouseMove(x: number, y: number) {
        this.move(false, { x: x, y: y });
    }


    /** 
     *  Draw the HUD scene
     */
    drawHUD() {
        Manager.Stack.subTop.drawHUD();
        this.windowBoxConfirm.draw();
        this.windowChoicesConfirm.draw();
    }
}

export { Confirm }