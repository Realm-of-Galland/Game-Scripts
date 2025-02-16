/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { Graphic } from "..";
import { Enum, ScreenResolution, Utils } from "../Common";

/** @class
 *  A chrono in the game.
 *  @param {number} start - The start time of the chrono (in milliseconds)
 */
class Chrono {

    public id: number;
    public time: number;
    public lastTime: number;
    public reverse: boolean;
    public paused: boolean = false;
    public graphic: Graphic.Text;
    public finished: boolean = false;

    constructor(start: number = 0, id: number = -1, reverse: boolean = false,
        displayOnScreen: boolean = false) {
        this.id = id;
        this.reverse = reverse;
        this.time = start;
        this.graphic = displayOnScreen ? new Graphic.Text(Utils.getStringDate(
            this.getSeconds()), { align: Enum.Align.Right, verticalAlign: Enum
            .AlignVertical.Top}) : null;
        this.lastTime = new Date().getTime();
    }

    /** 
     *  Get time time in seconds.
     *  @returns {number}
     */
    getSeconds(): number {
        return this.reverse ? Math.ceil(this.time / 1000) : Math.floor(this.time 
            / 1000);
    }

    /** 
     *  Pause the chrono.
     */
    pause() {
        this.paused = true;
    }

    /** 
     *  Continue the chrono (if paused).
     */
    continue() {
        this.paused = false;
        this.lastTime = new Date().getTime();
    }

    /** 
     *  Update the chrono. If reverse, return true if time reach 0.
     *  @returns {boolean}
     */
    update(): boolean {
        if (this.paused || this.finished) {
            return false;
        }
        let date = new Date().getTime();
        this.time += (this.reverse ? -1 : 1) * (date - this.lastTime);
        this.time = Math.max(0, this.time);
        this.lastTime = date;
        if (this.graphic !== null) {
            this.graphic.setText(Utils.getStringDate(this.getSeconds()));
        }
        this.finished = this.reverse && this.time === 0;
        return this.finished;
    }

    /** 
     *  Draw the HUD chrono.
     */
    drawHUD() {
        if (this.graphic !== null) {
            this.graphic.draw(0, 0, ScreenResolution.SCREEN_X, ScreenResolution
                .SCREEN_Y);
        }
    }
}

export { Chrono }