/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { Base } from "./Base";
import { Player, Picture2D, Frame } from "../Core";
import { Graphic, Datas, System, Manager } from "../index";
import { Enum, Constants, Utils, Platform, ScreenResolution } from "../Common";
import { Status } from "../Core/Status";

/** @class
 *  The graphic displaying all the stats in the player description state menu.
 *  @extends Graphic.Base
 *  @param {Player} player - The current selected player
 */
class PlayerDescription extends Base {

    public player: Player;
    public graphicNameCenter: Graphic.Text;
    public graphicName: Graphic.Text;
    public graphicDescription: Graphic.Text;
    public graphicClass: Graphic.Text;
    public graphicLevelName: Graphic.Text;
    public graphicLevel: Graphic.Text;
    public graphicExpName: Graphic.Text;
    public graphicExp: Graphic.Text;
    public listStatsNames: Graphic.Text[];
    public listStats: Graphic.Text[];
    public listLength: number[];
    public battler: Picture2D;
    public battlerFrame: Frame;
    public listStatsProgression: Graphic.Text[];
    public maxLength: number;

    constructor(player: Player) {
        super();

        this.player = player;

        // Informations
        let system = this.player.system;
        let cl = this.player.getClass();
        let levelStat = Datas.BattleSystems.getLevelStatistic();
        let expStat = Datas.BattleSystems.getExpStatistic();

        // All the graphics
        this.graphicNameCenter = new Graphic.Text(this.player.name, { align: Enum
            .Align.Center });
        this.graphicName = new Graphic.Text(this.player.name);
        this.graphicDescription = new Graphic.Text(system.description.name())
        this.graphicClass = new Graphic.Text(cl.name(), { fontSize: Constants
            .MEDIUM_FONT_SIZE });
        this.graphicLevelName = new Graphic.Text(levelStat.name());
        this.graphicLevel = new Graphic.Text(Utils.numToString(player[levelStat
            .abbreviation]));
        if (expStat === null) {
            this.graphicExpName = null;
        } else {
            this.graphicExpName = new Graphic.Text(expStat.name(), { fontSize: 
                Constants.MEDIUM_FONT_SIZE });
            this.graphicExp = new Graphic.Text(player.getBarAbbreviation(expStat
                ), { fontSize: Constants.MEDIUM_FONT_SIZE });
        }

        // Adding stats
        this.listStatsNames = new Array;
        this.listStats = new Array;
        this.listLength = new Array;
        let maxLength = 0;
        let id: number, statistic: System.Statistic, graphicName: Graphic.Text, 
            txt: string;
        for (let i = 0, j = 0, l = Datas.BattleSystems.statisticsOrder.length; i
            < l; i++)
        {
            id = Datas.BattleSystems.statisticsOrder[i];
            if (id !== Datas.BattleSystems.idLevelStatistic && id !== Datas
                .BattleSystems.idExpStatistic)
            {
                statistic = Datas.BattleSystems.getStatistic(id);
                if (statistic.isRes) {
                    continue;
                }
                graphicName = new Graphic.Text(statistic.name() + Constants
                    .STRING_COLON);
                maxLength = Math.max(graphicName.textWidth, maxLength)
                if (j % 7 === 6) {
                    this.listLength.push(maxLength);
                    maxLength = 0;
                }
                this.listStatsNames.push(graphicName);
                txt = Utils.numToString(this.player[statistic.abbreviation]);
                if (!statistic.isFix) {
                    txt += Constants.STRING_SLASH + this.player[statistic
                        .getMaxAbbreviation()];
                }
                this.listStats.push(new Graphic.Text(txt));
                j++;
            }
        }
        this.listLength.push(maxLength);

        // Battler
        this.battler = Datas.Pictures.getPictureCopy(Enum.PictureKind.Battlers, 
            system.idBattler);
        this.battlerFrame = new Frame(250, { frames: Datas.Systems.battlersFrames });
    }

    /** 
     *  Initialize the statistic progression
     */
    initializeStatisticProgression() {
        this.listStatsProgression = new Array;
        let id: number, statistic: System.Statistic, value: number, graphic: 
            Graphic.Text;
        for (let i = 0, l = Datas.BattleSystems.statisticsOrder.length; i < l; i++) {
            id = Datas.BattleSystems.statisticsOrder[i];
            if (id !== Datas.BattleSystems.idLevelStatistic && id !== Datas
                .BattleSystems.idExpStatistic)
            {
                statistic = Datas.BattleSystems.getStatistic(id);
                if (statistic.isRes) {
                    continue;
                }
                let txt: string;
                if (value > 0) {
                    txt = "+";
                } else if (value < 0) {
                    txt = "-";
                } else {
                    txt = "";
                }
                value = this.player[statistic.abbreviation] - this.player[
                    statistic.getBeforeAbbreviation()];
                graphic = new Graphic.Text(txt + value);
                if (value > 0) {
                    graphic.color = System.Color.GREEN;
                } else if (value < 0) {
                    graphic.color = System.Color.RED;
                }
                this.listStatsProgression.push(graphic);
            }
        }
    }

    /** 
     *  Update the statistic progression.
     */
    updateStatisticProgression() {
        this.listStatsNames = new Array;
        this.listStats = new Array;
        this.maxLength = 0;
        let id: number, statistic: System.Statistic, graphicName: Graphic.Text, 
            txt: string;
        for (let i = 0, l = Datas.BattleSystems.statisticsOrder.length; i < l; i++) {
            id = Datas.BattleSystems.statisticsOrder[i];
            if (id !== Datas.BattleSystems.idLevelStatistic && id !== Datas
                .BattleSystems.idExpStatistic)
            {
                statistic = Datas.BattleSystems.getStatistic(id);
                graphicName = new Graphic.Text(statistic.name() + Constants
                    .STRING_COLON);
                this.maxLength = Math.max(graphicName.textWidth, this.maxLength);
                this.listStatsNames.push(graphicName);
                txt = "";
                if (this.player.stepLevelUp === 0) {
                    txt += statistic.isFix ? this.player[statistic
                        .getBeforeAbbreviation()] : this.player[statistic
                        .abbreviation];
                    if (!statistic.isFix) {
                        txt += Constants.STRING_SLASH + this.player[statistic
                            .getBeforeAbbreviation()];
                    }
                    txt += " -> ";
                }
                txt += this.player[statistic.abbreviation];
                if (!statistic.isFix) {
                    txt += Constants.STRING_SLASH + this.player[statistic
                        .getMaxAbbreviation()];
                }
                this.listStats.push(new Graphic.Text(txt));
            }
        }
    }

    /** 
     *  Update the battler frame.
     */
    updateBattler() {
        if (this.battlerFrame.update()) {
            Manager.Stack.requestPaintHUD = true;
        }
    }

    /** 
     *  Drawing the statistic progression.
     *  @param {number} x - The x position to draw graphic
     *  @param {number} y - The y position to draw graphic
     *  @param {number} w - The width dimention to draw graphic
     *  @param {number} h - The height dimention to draw graphic
     */
    drawStatisticProgression(x: number, y: number, w: number, h: number) {
        for (let i = 0, l = this.listStatsNames.length; i < l; i++) {
            this.listStatsNames[i].draw(x, y * ScreenResolution.getScreenMinXY(30), 
                0, 0);
            this.listStats[i].draw(x + this.maxLength + ScreenResolution
                .getScreenMinXY(10) , i * ScreenResolution.getScreenMinXY(30), 0, 0);
        }
    }

    /** 
     *  Drawing the player in choice box
     *  @param {number} x - The x position to draw graphic
     *  @param {number} y - The y position to draw graphic
     *  @param {number} w - The width dimention to draw graphic
     *  @param {number} h - The height dimention to draw graphic
     */
    drawChoice(x: number, y: number, w: number, h: number) {
        this.graphicNameCenter.draw(x, y, w, h);
    }

    /**
     *  Drawing the player description
     *  @param {number} x - The x position to draw graphic
     *  @param {number} y - The y position to draw graphic
     *  @param {number} w - The width dimention to draw graphic
     *  @param {number} h - The height dimention to draw graphic
     */
    draw(x: number, y: number, w: number, h: number) {
        let xCharacter = x + ScreenResolution.getScreenMinXY(80);
        let yName = y + ScreenResolution.getScreenMinXY(20);
        let coef = Constants.BASIC_SQUARE_SIZE / Datas.Systems.SQUARE_SIZE;
        let wBattler = this.battler.w / Datas.Systems.battlersFrames;
        let hBattler = this.battler.h / Datas.Systems.battlersColumns;
        let owBattler = this.battler.oW / Datas.Systems.battlersFrames;
        let ohBattler = this.battler.oH / Datas.Systems.battlersColumns;

        // Battler
        this.battler.draw({ x: x + (ScreenResolution.getScreenMinXY(80) - 
            (wBattler * coef)) / 2, y: y + ScreenResolution.getScreenMinXY(80) - 
            (hBattler * coef) - ScreenResolution.getScreenMinXY(15), w: owBattler 
            * coef, h: ohBattler * coef, sx: this.battlerFrame.value * owBattler, 
            sy: 0, sw: owBattler, sh: ohBattler });

        // Name, level, description, exp
        yName = y + ScreenResolution.getScreenMinXY(10);
        this.graphicName.draw(xCharacter, yName, 0, 0);
        let xLevelName = xCharacter + this.graphicName.textWidth + ScreenResolution
            .getScreenMinXY(10);
        this.graphicLevelName.draw(xLevelName, yName, 0, 0);
        let xLevel = xLevelName + this.graphicLevelName.textWidth;
        this.graphicLevel.draw(xLevel, yName, 0, 0);
        let xStatus = xLevel + this.graphicLevel.textWidth;
        Status.drawList(this.player.status, xStatus, yName);
        let yClass = yName + ScreenResolution.getScreenMinXY(Constants.HUGE_SPACE);
        this.graphicClass.draw(xCharacter, yClass, 0, 0);
        let yExp = yClass + ScreenResolution.getScreenMinXY(Constants.HUGE_SPACE);
        let yDescription = yExp;
        if (this.graphicExpName !== null) {
            this.graphicExpName.draw(xCharacter, yExp, 0, 0);
            this.graphicExp.draw(xCharacter + this.graphicExpName.textWidth + 
                ScreenResolution.getScreenMinXY(Constants.LARGE_SPACE), yExp, 0, 0);
            yDescription += ScreenResolution.getScreenMinXY(Constants.HUGE_SPACE);
        }
        this.graphicDescription.draw(xCharacter, yDescription, 0, 0);
        let yStats = yDescription + ScreenResolution.getScreenMinXY(30);

        // Stats
        let xStat: number, yStat: number;
        for (let i = 0, l = this.listStatsNames.length; i < l; i++) {
            xStat = x + ScreenResolution.getScreenMinXY(Math.floor(i / 7) * 190);
            yStat = yStats + ScreenResolution.getScreenMinXY((i % 7) * 30);
            this.listStatsNames[i].draw(xStat, yStat, 0, 0);
            this.listStats[i].draw(xStat + this.listLength[Math.floor(i / 7)] + 
                ScreenResolution.getScreenMinXY(Constants.LARGE_SPACE), yStat, 
                0, 0);
        }
    }
}

export { PlayerDescription }