/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { Base } from "./Base";
import { Enum, Constants, Platform, ScreenResolution } from "../Common";
import Align = Enum.Align;
import PictureKind = Enum.PictureKind;
import { Picture2D } from "../Core";
import { Graphic, Datas, System } from "../index";

/** @class
 *  The graphic displaying a text and an icon.
 *  @extends Graphic.Base
 *  @param {string} text - The brut text to display
 *  @param {number} iconID - The icon ID
 *  @param {Object} [opts={}] - Options
 *  @param {Align} [opts.side=Align.Left] - The side to display icon
 *  @param {Align} [opts.align=Align.left] - The complete graphic align
 *  @param {number} [opts.space=RPM.MEDIUM_SPACE] - The space between icon and 
 *  text
 */
class TextIcon extends Base {

    public text: string;
    public iconID: number;
    public indexX: number;
    public indexY: number;
    public system: System.Base;
    public side: Align;
    public align: Align;
    public space: number;
    public graphicIcon: Picture2D;
    public graphicText: Graphic.Text;

    constructor(text: string, iconID: number, indexX: number, indexY: number, { 
        side = Align.Left, align = Align.Left, space = Constants.MEDIUM_SPACE } 
        = {}, textOptions = {})
    {
        super();

        this.iconID = iconID;
        this.indexX = indexX;
        this.indexY = indexY;
        this.side = side;
        this.align = align;
        this.space = ScreenResolution.getScreenMinXY(space);
        this.graphicIcon = Datas.Pictures.getPictureCopy(PictureKind.Icons, this
            .iconID);
        this.graphicText = new Graphic.Text("", textOptions);
        this.setText(text);
    }

    /** 
     *  Create a graphic according to a System.Icon.
     *  @static
     *  @returns {number}
     */
    static createFromSystem(text: string, icon: System.Icon, options = {}, 
        textOptions = {}): Graphic.TextIcon {
        return new Graphic.TextIcon(text, icon === null ? -1 : icon.pictureID, 
            icon === null ? 0 : icon.pictureIndexX, icon === null ? 0 : icon
            .pictureIndexY, options, textOptions);
    }

    /** 
     *  Get the max possible height.
     *  @returns {number}
     */
    getMaxHeight(): number {
        return Math.max(this.graphicText.fontSize, ScreenResolution.getScreenMinXY(
            Datas.Systems.iconsSize));
    }

    /** 
     *  Get the width.
     *  @returns {number}
     */
    getWidth(): number {
        return ScreenResolution.getScreenMinXY(Datas.Systems.iconsSize) + this
            .space + this.graphicText.textWidth;
    }

    /** 
     *  Set the text.
     *  @param {string} text
     */
    setText(text: string) {
        if (this.text !== text) {
            this.text = text;
            this.graphicText.setText(text);
            this.graphicText.measureText();
        }
    }

    /** 
     *  Drawing the content choice.
     *  @param {number} x - The x position to draw graphic
     *  @param {number} y - The y position to draw graphic
     *  @param {number} w - The width dimention to draw graphic
     *  @param {number} h - The height dimention to draw graphic
     */
    drawChoice(x: number, y: number, w: number, h: number) {
        let iconWidth = ScreenResolution.getScreenMinXY(Datas.Systems.iconsSize);
        let iconHeight = ScreenResolution.getScreenMinXY(Datas.Systems.iconsSize);

        // Align offset
        let offset: number;
        switch (this.align) {
            case Align.Left:
                offset = 0;
                break;
            case Align.Right:
                offset = w - this.getWidth();
                break;
            case Align.Center:
                offset = (w - this.getWidth()) / 2;
                break;
        }

        // Draw according to side
        let sx = this.indexX * Datas.Systems.iconsSize;
        let sy = this.indexY * Datas.Systems.iconsSize;
        if (this.side === Align.Left) {
            this.graphicIcon.draw({ x: x + offset, y: y - (iconHeight / 2) + (h 
                / 2), w: Datas.Systems.iconsSize, h: Datas.Systems.iconsSize, sx: 
                sx, sy: sy, sw: Datas.Systems.iconsSize, sh: Datas.Systems.iconsSize });
            offset += iconWidth + this.space;
            this.graphicText.draw(x + offset, y, w, h);
        } else if (this.side === Align.Right) {
            this.graphicText.draw(x + offset, y, w, h);
            offset += this.graphicText.textWidth + this.space;
            this.graphicIcon.draw({ x: x + offset, y: y - (iconHeight / 2) + (h 
                / 2), w: Datas.Systems.iconsSize, h: Datas.Systems.iconsSize, sx: 
                sx, sy: sy, sw: Datas.Systems.iconsSize, sh: Datas.Systems.iconsSize });
        }
    }

    /** 
     *  Drawing the content.
     *  @param {number} x - The x position to draw graphic
     *  @param {number} y - The y position to draw graphic
     *  @param {number} w - The width dimention to draw graphic
     *  @param {number} h - The height dimention to draw graphic
     */
    draw(x: number, y: number, w: number, h: number) {
        this.drawChoice(x, y, w, h);
    }
}

export { TextIcon }