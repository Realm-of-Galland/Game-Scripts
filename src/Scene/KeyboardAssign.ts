/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { Base } from "./Base";
import { Datas, Graphic, Scene, Manager } from "../index";
import { Picture2D, WindowBox, WindowChoices } from "../Core";
import { Enum, Constants, ScreenResolution, Inputs } from "../Common";

/** @class
 *  A scene for the keyboard assign setting.
 *  @extends Scene.Base
 */
class KeyboardAssign extends Base {

    public static WINDOW_PRESS_WIDTH = 300;
    public static WINDOW_PRESS_HEIGHT = 200;
    public static MAX_WAIT_TIME_FIRST = 3000;
    public static MAX_WAIT_TIME = 1000;

    public pictureBackground: Picture2D;
    public windowKeyboard: WindowBox;
    public windowInformations: WindowBox;
    public windowChoicesMain: WindowChoices;
    public windowPress: WindowBox;
    public showPress: boolean;
    public currentSC: number[][];
    public keysPressed: number[];
    public compareWait: number;
    public waitTime: number;
    public originalSC: number[][];
    public nextOR: boolean;

    constructor() {
        super();
    }

    /** 
     *  Load async stuff.
     */
    async load() {
        // Creating background
        if (Datas.TitlescreenGameover.isTitleBackgroundImage) {
            this.pictureBackground = await Picture2D.createWithID(Datas
                .TitlescreenGameover.titleBackgroundImageID, Enum.PictureKind
                .TitleScreen, { cover: true });
        }

        // Creating windows
        this.windowKeyboard = new WindowBox(Constants.HUGE_SPACE, Constants
            .HUGE_SPACE, WindowBox.MEDIUM_SLOT_WIDTH, WindowBox
            .LARGE_SLOT_HEIGHT,
            {
                content: new Graphic.Text("KEYBOARD", { align: Enum.Align.Center }),
                padding: WindowBox.SMALL_SLOT_PADDING
            }
        );
        this.windowInformations = new WindowBox(Constants.HUGE_SPACE + WindowBox
            .MEDIUM_SLOT_WIDTH + Constants.LARGE_SPACE, Constants.HUGE_SPACE, 
            ScreenResolution.SCREEN_X - (2 * Constants.HUGE_SPACE) - WindowBox
            .MEDIUM_SLOT_WIDTH - Constants.LARGE_SPACE, WindowBox
            .LARGE_SLOT_HEIGHT, 
            {
                content: new Graphic.Text("Select a keyboard shortcut to edit.",
                    { align: Enum.Align.Center }),
                padding: WindowBox.SMALL_SLOT_PADDING
            }
        );
        this.windowChoicesMain = new WindowChoices(Constants.HUGE_SPACE, 
            Constants.HUGE_SPACE + WindowBox.LARGE_SLOT_HEIGHT + Constants
            .LARGE_SPACE, ScreenResolution.SCREEN_X - (2 * Constants.HUGE_SPACE)
            , WindowBox.MEDIUM_SLOT_HEIGHT, Datas.Keyboards.getCommandsGraphics(),
            {
                nbItemsMax: 9,
                listCallbacks: Datas.Keyboards.getCommandsActions(),
                bordersInsideVisible: false
            }
        );
        this.windowPress = new WindowBox((ScreenResolution.SCREEN_X / 2) - (
            Scene.KeyboardAssign.WINDOW_PRESS_WIDTH / 2), (ScreenResolution
            .SCREEN_Y / 2) - (Scene.KeyboardAssign.WINDOW_PRESS_HEIGHT / 2), 
            Scene.KeyboardAssign.WINDOW_PRESS_WIDTH, Scene.KeyboardAssign
            .WINDOW_PRESS_HEIGHT,
            {
                content: this.windowChoicesMain.getCurrentContent(),
                padding: WindowBox.DIALOG_PADDING_BOX
            }
        );

        // Initialize
        this.showPress = false;
        this.currentSC = [];
        this.keysPressed = [];
        this.compareWait = Scene.KeyboardAssign.MAX_WAIT_TIME_FIRST;
        
        this.loading = false;
    }

    /** 
     *  Update the key.
     */
    updateKey(): boolean {
        this.compareWait = Scene.KeyboardAssign.MAX_WAIT_TIME_FIRST;
        this.waitTime = new Date().getTime();
        this.showPress = true;
        let graphic = <Graphic.Keyboard> this.windowChoicesMain
            .getCurrentContent();
        this.originalSC = graphic.kb.sc;
        this.currentSC = [];
        graphic.updateShort(this.currentSC);
        this.nextOR = true;
        return true;
    }

    /** 
     *  Cancel the scene.
     */
    cancel() {
        Datas.Systems.soundCancel.playSound();
        Manager.Stack.pop();
    }

    /** 
     *  Move keyboard assign.
     */
    move() {
        this.windowPress.content = this.windowChoicesMain.getCurrentContent();
    }

    /** 
     *  Update the scene.
     */
    update() {
        if (this.showPress) {
            if (this.keysPressed.length === 0 && new Date().getTime() - this
                .waitTime >= this.compareWait)
            {
                this.showPress = false;

                // If nothing, go back to previous sc
                let graphic = <Graphic.Keyboard> this.windowChoicesMain
                    .getCurrentContent();
                if (this.currentSC.length === 0) {
                    graphic.updateShort(this.originalSC);
                } else {
                    Datas.Settings.updateKeyboard(graphic.kb.id, this.currentSC);
                }
                Manager.Stack.requestPaintHUD = true;
            }
        } else {
            this.windowChoicesMain.update();
        }
    }

    /** 
     *  Handle scene key pressed.
     *  @param {number} key - The key ID
     */
    onKeyPressed(key: number) {
        if (this.showPress) {
            this.keysPressed.push(key);
            if (this.nextOR) {
                this.currentSC.push([]);
                this.nextOR = false;
            }
            let current = this.currentSC[this.currentSC.length - 1];
            if (current.indexOf(key) === -1) {
                this.compareWait = Scene.KeyboardAssign.MAX_WAIT_TIME_FIRST;
                this.currentSC[this.currentSC.length - 1].push(key);
                (<Graphic.Keyboard> this.windowChoicesMain.getCurrentContent())
                    .updateShort(this.currentSC);
            }
        } else {
            this.windowChoicesMain.onKeyPressed(key, this);
            if (Datas.Keyboards.checkCancelMenu(key)) {
                this.cancel();
            }
        }
    }

    /** 
     *  Handle scene key released.
     *  @param {number} key - The key ID
     */
    onKeyReleased(key: number) {
        this.keysPressed.splice(this.keysPressed.indexOf(key), 1);
        if (this.keysPressed.length === 0 && this.currentSC.length > 0) {
            this.compareWait = Scene.KeyboardAssign.MAX_WAIT_TIME;
            this.nextOR = true;
            this.waitTime = new Date().getTime();
        }
    }

    /** 
     *  Handle scene pressed and repeat key.
     *  @param {number} key - The key ID
     *  @returns {boolean}
     */
    onKeyPressedAndRepeat(key: number): boolean {
        if (!this.showPress) {
            this.windowChoicesMain.onKeyPressedAndRepeat(key);
            this.move();
        }
       return true;
    }

    /** 
     *  @inheritdoc
     */
    onMouseMove(x: number, y: number) {
        if (!this.showPress) {
            this.windowChoicesMain.onMouseMove(x, y);
            this.move();
        }
    }

    /** 
     *  @inheritdoc
     */
    onMouseUp(x: number, y: number) {
        if (!this.showPress) {
            this.windowChoicesMain.onMouseUp(x, y, this);
            if (Inputs.mouseRightPressed) {
                this.cancel();
            }
        }
    }

    /** 
     *  Draw the HUD scene
     */
    drawHUD() {
        if (Datas.TitlescreenGameover.isTitleBackgroundImage) {
            this.pictureBackground.draw();
        }
        this.windowKeyboard.draw();
        this.windowInformations.draw();
        this.windowChoicesMain.draw();
        if (this.showPress) {
            this.windowPress.draw();
        }
    }
}

export { KeyboardAssign }