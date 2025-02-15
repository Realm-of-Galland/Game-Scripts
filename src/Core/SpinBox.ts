/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { Datas, Graphic, Manager } from "..";
import { ScreenResolution } from "../Common";
import { Bitmap } from "./Bitmap";
import { Rectangle } from "./Rectangle";
import { WindowBox } from "./WindowBox";
import { WindowChoices } from "./WindowChoices";

/**
 * The class for window boxes.
 * @class
 * @extends {Bitmap}
 */
class SpinBox extends Bitmap {

    public static DEFAULT_WIDTH: number = 150;
    public static DEFAULT_HEIGHT: number = 50;
    public windowBox: WindowBox;
    public value: number;
    public min: number;
    public max: number;
    public allowLeftRight: boolean;
    public active: boolean;
    public startTime: number;
    public mouseArrowTime: number;
    public isMouseInArrowUp: boolean = false;
    public isMouseInArrowDown: boolean = false;

    /**
     *  @param {number} x - The x coordinates
     *  @param {number} y - The y coordinates
     */
    constructor(x: number, y: number, { w = SpinBox.DEFAULT_WIDTH, h = SpinBox
        .DEFAULT_HEIGHT, value = 1, min = 1, max = 100, active = true, 
        allowLeftRight = true, times = true } = {}) {
        super(x, y, w, h);
        this.value = value;
        this.min = min;
        this.max = max;
        this.allowLeftRight = allowLeftRight;
        const graphic = new Graphic.SpinBox(value, times);
        const options = { 
            content: graphic,
            padding: WindowBox.MEDIUM_PADDING_BOX,
            selected: true
        };
        this.windowBox = new WindowBox(x, y, w, h, options);
        this.startTime = new Date().getTime();
        this.mouseArrowTime = new Date().getTime();
        this.setActive(active);
    }

    /** 
     *  Set the x value.
     *  @param {number} x - The x value
     */
    setX(x: number) {
        super.setX(x);
        if (this.windowBox) {
            this.windowBox.setX(x);
        }
    }

    /** 
     *  Set the y value.
     *  @param {number} y - The y value
     */
    setY(y: number) {
        super.setY(y);
        if (this.windowBox) {
            this.windowBox.setY(y);
        }
    }

    /** 
     *  Set the w value.
     *  @param {number} w - The w value
     */
    setW(w: number) {
        super.setW(w);
        if (this.windowBox) {
            this.windowBox.setW(w);
        }
    }

    /** 
     *  Set the h value.
     *  @param {number} h - The h value
     */
    setH(h: number) {
        super.setH(h);
        if (this.windowBox) {
            this.windowBox.setH(h);
        }
    }

    /** 
     *  Update active.
     *  @param {boolean} active
     */
    setActive(active: boolean) {
        if (active !== this.active) {
            this.active = active;
            this.windowBox.selected = active;
        }
    }

    /** 
     *  Update value.
     *  @param {number} value
     */
    updateValue(value: number) {
        if (value !== this.value) {
            this.value = value;
            Datas.Systems.soundCursor.playSound();
            (<Graphic.SpinBox>this.windowBox.content).setValue(value);
            Manager.Stack.requestPaintHUD = true;
        }
    }

    /** 
     *  Update when going down.
     */
    goDown() {
        let value = this.value;
        if (this.value > this.min) {
            value--;
        }
        this.updateValue(value);
    }

    /** 
     *  Update when going up.
     */
    goUp() {
        let value = this.value;
        if (this.value < this.max) {
            value++;
        }
        this.updateValue(value);
    }

    /** 
     *  Update when going left.
     */
    goLeft() {
        if (this.allowLeftRight) {
            this.updateValue(Math.max(this.value - 10, this.min));
        }
    }

    /** 
     *  Update when going right.
     */
    goRight() {
        if (this.allowLeftRight) {
            this.updateValue(Math.min(this.value + 10, this.max));
        }
    }

    /** 
     *  A widget move.
     *  @param {boolean} isKey
     *  @param {{ key?: number, x?: number, y?: number }} [options={}]
     */
    move(isKey: boolean, options: { key?: number, x?: number, y?: number } = {}) {
        if (isKey) {
            this.onKeyPressedAndRepeat(options.key);
        } else {
            this.onMouseMove(options.x, options.y);
        }
    }

    /** 
     *  Update the widget.
     */
    update() {
        let t = new Date().getTime();
        if (t - this.mouseArrowTime >= WindowChoices.TIME_WAIT_MOUSE_ARROW) {
            this.mouseArrowTime = t;
            // If pressing on arrow up
            if (this.isMouseInArrowUp) {
                this.goUp();
            }
            // If pressing on arrow down
            if (this.isMouseInArrowDown) {
                this.goDown();
            }
        }
    }

    /** 
     *  Key pressed repeat handle, but with a small wait after the first 
     *  pressure (generally used for menus).
     *  @param {number} key - The key ID pressed
     *  @returns {boolean} false if the other keys are blocked after it
     */
    onKeyPressedAndRepeat(key: number): boolean {
        if (this.active) {
            let t = new Date().getTime();
            if (t - this.startTime >= WindowChoices.TIME_WAIT_PRESS) {
                this.startTime = t;
                if (Datas.Keyboards.isKeyEqual(key, Datas.Keyboards.menuControls.Down)) {
                    this.goDown();
                } else if (Datas.Keyboards.isKeyEqual(key, Datas.Keyboards.menuControls.Up)) {
                    this.goUp();
                } else if (Datas.Keyboards.isKeyEqual(key, Datas.Keyboards.menuControls.Right)) {
                    this.goRight();
                } else if (Datas.Keyboards.isKeyEqual(key, Datas.Keyboards.menuControls.Left)) {
                    this.goLeft();
                }
            }
        }
        return true;
    }

    /** 
     *  Mouse down handle for the current stack.
     *  @param {number} x - The x mouse position on screen
     *  @param {number} y - The y mouse position on screen
     */
    onMouseMove(x: number, y: number) {
        if (this.active) {
            this.isMouseInArrowDown = false;
            this.isMouseInArrowUp = false;
            const ws = Datas.Systems.getCurrentWindowSkin();
            const arrowWidth = ScreenResolution.getScreenXY(ws.arrowUpDown[2]);
            const arrowHeight = ScreenResolution.getScreenXY(ws.arrowUpDown[3]);
            if (this.value < this.max) {
                let rect = new Rectangle(this.x + (this.w - arrowWidth) / 2, 
                    this.y - (arrowHeight / 2) - 1, arrowWidth, arrowHeight);
                if (rect.isInside(x, y)) {
                    this.isMouseInArrowUp = true;
                }
            }
            if (this.value > this.min ) {
                let rect = new Rectangle(this.x + (this.w - arrowWidth) / 2, 
                    this.y + this.h + 1, arrowWidth, arrowHeight);
                if (rect.isInside(x, y)) {
                    this.isMouseInArrowDown = true;
                }
            }
        }
    }

    /** 
     *  Draw the spin box.
     */
    draw() {
        this.windowBox.draw();
        if (this.active) {
            const ws = Datas.Systems.getCurrentWindowSkin();
            if (this.value < this.max) {
                ws.drawArrowUp(this.oX + (this.oW - ws.arrowUpDown[2]) / 2, this
                    .oY - (ws.arrowUpDown[3] / 2) - 1);
            }
            if (this.value > this.min ) {
                ws.drawArrowDown(this.oX + (this.oW - ws.arrowUpDown[2]) / 2, 
                    this.oY + this.oH + 1);
            }
        }
    }
}

export { SpinBox }