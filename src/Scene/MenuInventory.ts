/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { Base } from "./Base";
import { Graphic, Datas, Scene, Manager, System } from "../index";
import { Constants, Enum, ScreenResolution } from "../Common";
import Align = Enum.Align;
import OrientationWindow = Enum.OrientationWindow;
import ItemKind = Enum.ItemKind;
import TargetKind = Enum.TargetKind;
import AvailableKind = Enum.AvailableKind;
import { WindowBox, WindowChoices, Item, Game, Rectangle } from "../Core";
import { Menu, StructPositionChoice } from "./Menu";

/** @class
 *  A scene in the menu for describing inventory.
 *  @extends Scene.Base
 */
class MenuInventory extends Base {

    public windowTop: WindowBox;
    public windowChoicesTabs: WindowChoices;
    public windowChoicesList: WindowChoices;
    public windowBoxInformation: WindowBox;
    public windowEmpty: WindowBox;
    public windowBoxUseItem: WindowBox;
    public positionChoice: StructPositionChoice[];
    public substep: number;

    constructor() {
        super(false);

        Scene.Map.current.user = null;
        Scene.Map.current.targets = [];

        // Initializing the top menu for item kinds
        let l = Datas.Systems.inventoryFilters.length;
        let menuKind: Graphic.Text[] = new Array();
        let i: number;
        for (i = 0, l = Datas.Systems.inventoryFilters.length; i < l; i++) {
            menuKind[i] = new Graphic.Text(Datas.Systems.inventoryFilters[i]
                .name(), { align: Align.Center });
        }

        // All the windows
        this.windowTop = new WindowBox(20, 20, 200, 30, {
                content: new Graphic.Text("Inventory", { align: Align.Center })
            }
        );
        this.windowChoicesTabs = new WindowChoices(5, 60, 100, WindowBox
            .SMALL_SLOT_HEIGHT, menuKind, {
                orientation: OrientationWindow.Horizontal,
                nbItemsMax: 6
            }
        );
        this.createWindowChoicesList();
        this.createWindowBoxInformation();
        this.windowEmpty = new WindowBox(10, 100, ScreenResolution.SCREEN_X - 20
            , WindowBox.SMALL_SLOT_HEIGHT, {
                content: new Graphic.Text("Empty", { align: Align.Center }),
                padding: WindowBox.SMALL_SLOT_PADDING
            }
        );
        this.createWindowBoxUseItem();
        l = menuKind.length;
        this.positionChoice = new Array(l);
        for (i = 0; i < l; i++) {
            this.positionChoice[i] = {
                index: 0,
                offset: 0
            };
        }

        // Update for changing tab
        this.substep = 0;
        this.updateForTab();
        this.synchronize();
    }

    /**
     *  Create the choice list.
     */
    createWindowChoicesList() {
        const rect = new Rectangle(Constants.HUGE_SPACE, Constants.HUGE_SPACE + 
            ((WindowBox.SMALL_SLOT_HEIGHT + Constants.LARGE_SPACE) * 2), WindowBox
            .LARGE_SLOT_WIDTH, WindowBox.SMALL_SLOT_HEIGHT);
        const options = {
            nbItemsMax: Scene.Menu.SLOTS_TO_DISPLAY
        };
        this.windowChoicesList = new WindowChoices(rect.x, rect.y, rect.width, 
            rect.height, [], options);
    }
    
    /**
     *  Create the information window.
     */
    createWindowBoxInformation() {
        const width = ScreenResolution.SCREEN_X - (Constants.HUGE_SPACE * 2) - 
            WindowBox.LARGE_SLOT_WIDTH - Constants.LARGE_SPACE;
        const height = 215;
        const rect = new Rectangle(ScreenResolution.SCREEN_X - Constants
            .HUGE_SPACE - width, Constants.HUGE_SPACE + ((WindowBox
            .SMALL_SLOT_HEIGHT + Constants.LARGE_SPACE) * 2), width, height);
        const options = { 
            padding: WindowBox.HUGE_PADDING_BOX
        };
        this.windowBoxInformation = new WindowBox(rect.x, rect.y, rect.width, rect
            .height, options);
    }

    /**
     *  Create the user item window.
     */
    createWindowBoxUseItem() {
        const width = this.windowBoxInformation.oW;
        const height = 140;
        const rect = new Rectangle(ScreenResolution.SCREEN_X - Constants
            .HUGE_SPACE - width, this.windowBoxInformation.oY + this
            .windowBoxInformation.oH + Constants.MEDIUM_SPACE, width, height);
        const graphic = new Graphic.UseSkillItem();
        const options = {
            content: graphic, 
            padding: WindowBox.SMALL_PADDING_BOX
        }
        this.windowBoxUseItem = new WindowBox(rect.x, rect.y, rect.width, rect
            .height, options);
    }

    /** 
     *  Update informations to display.
     */
    synchronize() {
        this.windowBoxInformation.content = this.windowChoicesList
            .getCurrentContent();
    }

    /** 
     *  Update tab.
     */
    updateForTab() {
        let indexTab = this.windowChoicesTabs.currentSelectedIndex;
        let nbItems = Game.current.items.length;
        let list = [];
        let ownedItem: Item;
        for (let i = 0; i < nbItems; i++) {
            ownedItem = Game.current.items[i];
            if (Datas.Systems.inventoryFilters[indexTab].getFilter()(ownedItem)) {
                list.push(new Graphic.Item(ownedItem));
            }
        }
        this.windowChoicesList.setContentsCallbacks(list);
        this.windowChoicesList.unselect();
        this.windowChoicesList.offsetSelectedIndex = this.positionChoice[
            indexTab].offset;
        this.windowChoicesList.select(this.positionChoice[indexTab].index);
    }

    /** 
     *  Use the current item.
     */
    useItem() {
        let graphic = <Graphic.Item> this.windowBoxInformation.content;
        if (graphic.item.system.consumable) {
            Game.current.useItem(graphic.item);
        }
        if (graphic.item.nb > 0) {
            graphic.updateNb();
        } else {
            this.updateForTab();
            this.substep = 0;
            Manager.Stack.requestPaintHUD = true;
        }
        (<Graphic.UseSkillItem> this.windowBoxUseItem.content).updateStats();
        Manager.Stack.requestPaintHUD = true;
    }

    /** 
     *  Move tab according to key.
     *  @param {number} key - The key ID 
     */
    moveTabKey(isKey: boolean, options: { key?: number, x?: number, y?: number } = {}) {
        // Tab
        let indexTab = this.windowChoicesTabs.currentSelectedIndex;
        if (isKey) {
            this.windowChoicesTabs.onKeyPressedAndRepeat(options.key);
        } else {
            this.windowChoicesTabs.onMouseMove(options.x, options.y);
        }
        if (indexTab !== this.windowChoicesTabs.currentSelectedIndex) {
            this.updateForTab();
        }

        // List
        if (isKey) {
            this.windowChoicesList.onKeyPressedAndRepeat(options.key);
        } else {
            this.windowChoicesList.onMouseMove(options.x, options.y);
        }
        let position = this.positionChoice[this.windowChoicesTabs
            .currentSelectedIndex];
        position.index = this.windowChoicesList.currentSelectedIndex;
        position.offset = this.windowChoicesList.offsetSelectedIndex;

        this.synchronize();
    }

    /** 
     *  A scene action.
     *  @param {boolean} isKey
     *  @param {{ key?: number, x?: number, y?: number }} [options={}]
     */
    action(isKey: boolean, options: { key?: number, x?: number, y?: number } = {}) {
        let graphic = <Graphic.Item> this.windowBoxInformation.content;
        let graphicUse = <Graphic.UseSkillItem> this.windowBoxUseItem.content;
        switch (this.substep) {
            case 0:
                if (Scene.MenuBase.checkActionMenu(isKey, options)) {
                    if (this.windowBoxInformation.content === null) {
                        return;
                    }
                    let targetKind = graphic.item.system.targetKind;
                    let availableKind = graphic.item.system.availableKind;
                    if (graphic.item.system.isPossible() && (availableKind 
                        === AvailableKind.Always || availableKind === 
                        AvailableKind.MainMenu))
                    {
                        if (targetKind === TargetKind.Ally || targetKind === 
                            TargetKind.AllAllies) {
                            Datas.Systems.soundConfirmation.playSound();
                            this.substep = 1;
                            graphicUse.setSkillItem(graphic.item.system);
                            graphicUse.setAll(targetKind === TargetKind.AllAllies);
                        } else if (targetKind === TargetKind.None) {
                            if (graphic.item.system.use()) {
                                Datas.Systems.soundConfirmation.playSound();
                                this.useItem();
                            } else {
                                Datas.Systems.soundImpossible.playSound();
                            }
                        } else {
                            Datas.Systems.soundImpossible.playSound();
                        }
                        Manager.Stack.requestPaintHUD = true;
                    } else {
                        Datas.Systems.soundImpossible.playSound();
                    }
                } else if (Scene.MenuBase.checkCancelMenu(isKey, options)) {
                    Datas.Systems.soundCancel.playSound();
                    Manager.Stack.pop();
                }
                break;
            case 1:
                if (Scene.MenuBase.checkActionMenu(isKey, options)) {
                    if (graphic.item.system.isPossible() && graphic.item.system.use()) {
                        Datas.Systems.soundConfirmation.playSound();
                        this.useItem();
                    } else {
                        Datas.Systems.soundCancel.playSound();
                    }
                } else if (Scene.MenuBase.checkCancelMenu(isKey, options)) {
                    Datas.Systems.soundCancel.playSound();
                    this.substep = 0;
                    Manager.Stack.requestPaintHUD = true;
                }
                break;
        }
    }

    /** 
     *  A scene move.
     *  @param {boolean} isKey
     *  @param {{ key?: number, x?: number, y?: number }} [options={}]
     */
    move(isKey: boolean, options: { key?: number, x?: number, y?: number } = {}) {
        switch (this.substep) {
            case 0:
                this.moveTabKey(isKey, options);
                break;
            case 1:
                if (isKey) {
                    (<Graphic.UseSkillItem>this.windowBoxUseItem.content)
                        .onKeyPressedAndRepeat(options.key);
                } else {
                    (<Graphic.UseSkillItem>this.windowBoxUseItem.content)
                    .onMouseMove(options.x, options.y);
                }
                break;
        }
    }

    /** 
     *  Update the scene.
     */
    update() {
        Scene.Base.prototype.update.call(Scene.Map.current);
        this.windowChoicesList.update();
        this.windowChoicesTabs.update();
        if (this.windowChoicesList.currentSelectedIndex !== -1) {
            this.windowBoxUseItem.update();
        }
    }

    /** 
     *  Handle scene key pressed.
     *  @param {number} key - The key ID
     */
    onKeyPressed(key: number) {
        Scene.Base.prototype.onKeyPressed.call(Scene.Map.current, key);
        this.action(true, { key: key });
    }

    /** 
     *  Handle scene key released.
     *  @param {number} key - The key ID
     */
    onKeyReleased(key: number) {
        Scene.Base.prototype.onKeyReleased.call(Scene.Map.current, key);
    }

    /** 
     *  Handle scene pressed repeat key.
     *  @param {number} key - The key ID
     *  @returns {boolean}
     */
    onKeyPressedRepeat(key: number): boolean {
        return Scene.Base.prototype.onKeyPressedRepeat.call(Scene.Map.current, key);
    }

    /** 
     *  Handle scene pressed and repeat key.
     *  @param {number} key - The key ID
     *  @returns {boolean}
     */
    onKeyPressedAndRepeat(key: number): boolean {
        let res = Scene.Base.prototype.onKeyPressedAndRepeat.call(Scene.Map
            .current, key);
        this.move(true, { key: key });
        return res;
    }

    /** 
     *  @inheritdoc
     */
    onMouseMove(x: number, y: number) {
        super.onMouseMove(x, y);
        this.move(false, { x: x, y: y });
    }

    /** 
     *  @inheritdoc
     */
    onMouseUp(x: number, y: number) {
        super.onMouseUp(x, y);
        this.action(false, { x: x, y: y });
    }

    /** 
     *  Draw the HUD scene.
     */
    drawHUD() {
        // Draw the local map behind
        Scene.Map.current.drawHUD();

        // Draw the menu
        this.windowTop.draw();
        this.windowChoicesTabs.draw();
        this.windowChoicesList.draw();
        if (this.windowChoicesList.listWindows.length > 0) {
            this.windowBoxInformation.draw();
            if (this.substep === 1) {
                this.windowBoxUseItem.draw();
            }
        } else {
            this.windowEmpty.draw();
        }
    }
}

export { MenuInventory }