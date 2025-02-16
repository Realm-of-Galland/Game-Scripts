/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { Scene, Manager, Common, System, Datas } from "../index";
import { Utils, Platform, ScreenResolution, Paths, Enum, Inputs } from "../Common";
import { Game, MapObject, Picture2D, Player } from "../Core";

/** @class
 *  The game stack that is organizing the game scenes.
 *  @static
 */
class Stack {

    public static top: Scene.Base = null;
    public static subTop: Scene.Base = null;
    public static bot: Scene.Base = null;
    public static content: Scene.Base[] = [];
    public static requestPaintHUD: boolean = false;
    public static sceneLoading: Scene.Loading;
    public static loadingDelay = 0;
    public static elapsedTime = 0;
    public static averageElapsedTime = 0;
    public static lastUpdateTime = new Date().getTime();
    public static displayedPictures: [number, Picture2D][] = [];
    public static isInMainMenu: boolean = false;

    constructor() {
        throw new Error("This is a static class");
    }

    /** 
     *  Push a new scene in the stack.
     *  @param {Scene.Base} scene - The scene to push
     */
    static push(scene: Scene.Base) {
        this.content.push(scene);
        this.top = scene;
        this.subTop = this.at(this.content.length - 2);
        this.bot = this.at(0);
        this.requestPaintHUD = true;
    }

    /** 
     *  Pop (remove) the last scene in the stack.
     *  @returns {Scene.Base} The last scene that is removed
     */
    static pop(): Scene.Base {
        let scene = this.content.pop();
        this.top = this.at(this.content.length - 1);
        this.subTop = this.at(this.content.length - 2);
        this.bot = this.at(0);
        scene.close();
        this.requestPaintHUD = true;
        return scene;
    }

    /** 
     *  Pop (remove) all the scene in the stack.
     *  @returns Scene.Base
     */
    static popAll(): Scene.Base {
        let scene: Scene.Base;
        for (let i = this.content.length - 1; i >= 0; i--) {
            scene = this.content.pop();
            scene.close();
        }
        this.top = null;
        this.subTop = null;
        this.bot = null;
        this.requestPaintHUD = true;
        return scene;
    }

    /** 
     *  Replace the last scene in the stack by a new scene.
     *  @param {SceneGame} scene - The scene to replace
     *  @returns {SceneGame} The last scene that is replaced
     */
    static replace(scene: Scene.Base): Scene.Base {
        let pop = this.pop();
        this.push(scene);
        return pop;
    }

    /** 
     *  Get the scene at a specific index in the stack. 0 is the bottom of the
     *  stack.
     *  @param {number} i - Index in the stack
     *  @returns {SceneGame} The scene in the index of the stack
     */
    static at(i: number): Scene.Base {
        return Utils.defaultValue(this.content[i], null);
    }

    /** 
     *  Check if the stack is empty.
     *  @returns {boolean}
     */
    static isEmpty(): boolean {
        return this.top === null;
    }

    /** 
     *  Check if top content is loading.
     *  @returns {boolean}
     */
    static isLoading(): boolean {
        return this.isEmpty() || this.top.loading;
    }

    /** 
     *  Push the title screen when empty.
     *  @returns {Scene.TitleScreen}
     */
    static pushTitleScreen(): Scene.TitleScreen {
        let scene = new Scene.TitleScreen();
        this.push(scene);
        return scene;
    }

    /** 
     *  Push the game over.
     *  @returns {Scene.GameOver}
     */
    static pushGameOver(): Scene.GameOver {
        let scene = new Scene.GameOver();
        this.push(scene);
        return scene;
    }

    /** 
     *  Push a battle scene for testing troop.
     */
    static async pushBattleTest() {
        let json = await Common.IO.parseFileJSON(Paths.FILE_TEST);
        let troopID = json.troopID;
        let battleMap = Datas.BattleSystems.getBattleMap(json
            .battleTroopTestBattleMapID);
        let heroes: System.HeroTroopBattleTest[] = [];
        Utils.readJSONSystemList({ list: json.battleTroopTestHeroes, listIndexes: 
            heroes, cons: System.HeroTroopBattleTest });
        Game.current = new Game();
        Game.current.initializeDefault();
        Game.current.heroBattle = new MapObject(Game.current.hero.system,
            battleMap.position.toVector3(), true);
        let player: Player;
        Game.current.teamHeroes = [];
        for (let hero of heroes) {
            player = Game.current.instanciateTeam(Enum.GroupKind.Team, Enum
                .CharacterKind.Hero, hero.heroID, hero.level, 1);
            hero.equip(player);
        }
        let scene = new Scene.Battle(troopID, true, true, battleMap, 0, 0, null, null);
        this.push(scene);
    }

    static async pushShowTextPreview() {
        this.push(new Scene.ShowTextPreview());
    }

    /** 
     *  Clear the HUD canvas.
     */
    static clearHUD() {
        Platform.ctx.clearRect(0, 0, ScreenResolution.CANVAS_WIDTH, 
            ScreenResolution.CANVAS_HEIGHT);
        Platform.ctx.lineWidth = 1;
        Platform.ctx.imageSmoothingEnabled = false;
    }

    /** 
     *  Translate all the current scenes.
     */
    static translateAll() {
        for (let scene of this.content) {
            scene.translate();
        }
    }

    /** 
     *  Update the stack.
     */
    static update() {
        // Update game timer if there's a current game
        if (Game.current !== null) {
            Game.current.update();
        }

        // Update songs manager
        Manager.Songs.update();

        // Repeat keypress as long as not blocking
        let continuePressed: boolean;
        for (let i = 0, l = Inputs.keysPressed.length; i < l; i++) {
            continuePressed = this.onKeyPressedRepeat(Inputs.keysPressed[i]);
            if (!continuePressed) {
                break;
            }
        }
        this.top.update();
    }

    /** 
     *  First key press handle for the current stack.
     *  @param {number} key - The key ID pressed
     */
    static onKeyPressed(key: number) {
        if (!this.isEmpty()) {
            this.top.onKeyPressed(key);
        }
    }

    /** 
     *  First key release handle for the current stack.
     *  @param {number} key - The key ID released
     */
    static onKeyReleased(key: number) {
        if (!this.isEmpty()) {
            this.top.onKeyReleased(key);
        }
    }

    /** 
     *  Key pressed repeat handle for the current stack.
     *  @param {number} key - The key ID pressed
     *  @returns {boolean} false if the other keys are blocked after it
     */
    static onKeyPressedRepeat(key: number): boolean {
        return this.isEmpty() ? true : this.top.onKeyPressedRepeat(key);
    }

    /** 
     *  Key pressed repeat handle for the current stack, but with
     *  a small wait after the first pressure (generally used for menus).
     *  @param {number} key - The key ID pressed
     *  @returns {boolean} false if the other keys are blocked after it
     */
    static onKeyPressedAndRepeat(key: number): boolean {
        return this.isEmpty() ? true : this.top.onKeyPressedAndRepeat(key);
    }

    /** 
     *  Mouse down handle for the current stack.
     *  @param {number} x - The x mouse position on screen
     *  @param {number} y - The y mouse position on screen
     */
    static onMouseDown(x: number, y: number) {
        if (!this.isEmpty()) {
            this.top.onMouseDown(x, y);
        }
    }

    /** 
     *  Mouse move handle for the current stack.
     *  @param {number} x - The x mouse position on screen
     *  @param {number} y - The y mouse position on screen
     */
    static onMouseMove(x: number, y: number) {
        if (!this.isEmpty()) {
            this.top.onMouseMove(x, y);
        }
    }

    /** 
     *  Mouse up handle for the current stack.
     *  @param {number} x - The x mouse position on screen
     *  @param {number} y - The y mouse position on screen
     */
    static onMouseUp(x: number, y: number) {
        if (!this.isEmpty()) {
            this.top.onMouseUp(x, y);
        }
    }

    /** 
     *  Draw the 3D for the current stack.
     */
    static draw3D() {
        if (!this.isEmpty()) {
            this.top.draw3D();
        }
    }

    /** 
     *  Draw HUD for the current stack.
     */
    static drawHUD() {
        if (this.requestPaintHUD) { 
            if (this.isLoading() && this.sceneLoading) {
                this.loadingDelay += this.elapsedTime;
                if (this.loadingDelay >= Scene.Loading.MIN_DELAY) {
                    this.requestPaintHUD = false;
                    this.sceneLoading.drawHUD();
                }
            } else {
                this.requestPaintHUD = false;
                this.loadingDelay = 0;
                this.clearHUD();
                if (!this.isEmpty()) {
                    // Display < 0 index image command
                    let i: number, l: number, v: [number, Picture2D];
                    for (i = 0, l = this.displayedPictures.length; i < l; i++) {
                        v = this.displayedPictures[i];
                        if (v[0] >= 0) {
                            break;
                        }
                        v[1].draw();
                    }
        
                    // Draw System HUD
                    this.top.drawHUD();
        
                    // Display >= 0 index image command
                    for (; i < l; i++) {
                        this.displayedPictures[i][1].draw();
                    }
                }
            }
            if (Game.current !== null) {
                Game.current.drawHUD();
            }
        }
    }
}

export { Stack };