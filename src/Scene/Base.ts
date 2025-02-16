/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { Camera, Node, ReactionInterpreter, MapObject } from "../Core";
import { System, Scene, Manager, Graphic, Datas } from "../index";
import { Enum, Utils } from "../Common";
import { Main } from "../main";

/**
 *  The superclass who shape the structure of a scene.
 *  @abstract
 */
abstract class Base {

    /**
     *  An array of reaction interpreters.
     *  @type {ReactionInterpreter[]}
     *  @memberof Base
     */
    public reactionInterpreters: ReactionInterpreter[];

    /**
     *  An array of reaction interpreters caused by effects.
     *  @type {ReactionInterpreter[]}
     *  @memberof Base
     */
    public reactionInterpretersEffects: ReactionInterpreter[];

    /**
     *  The array holding parallel commands.
     *  @type {ReactionInterpreter[]}
     *  @memberof Base
     */
    public parallelCommands: ReactionInterpreter[];

    /**
     *  The async loading flag.
     *  @type {boolean}
     *  @memberof Base
     */
    public loading: boolean;

    /**
     *  The scene camera.
     *  @type {Camera}
     *  @memberof Base
     */
    public camera: Camera;
    public graphicFPS: Graphic.Text = null;

    /**
     *  @param {boolean} [loading = true] - Tells whether or not the scene is 
     *  loading asynchronosively. 
     */
    constructor(loading: boolean = true, ...args: any) {
        this.reactionInterpreters = new Array;
        this.reactionInterpretersEffects = new Array;
        this.parallelCommands = new Array;
        this.initialize(...args);
        if (loading) {
            this.loading = true;
            Utils.tryCatch(this.load, this);
        }
        this.create();
        if (Datas.Systems.showFPS) {
            this.graphicFPS = new Graphic.Text('', { verticalAlign: Enum.AlignVertical.Top });
        }
    }

    initialize(...args: any) {}

    /**
     *  Assign and create all the contents of the scene synchronously.
     * 
     *  @example
     *  create(){
     *    super.create();
     *    this.createAllWindows();
     *  }
     */
    create() {}

    /**
     *  Load the scene asynchronous contents. 
     *  @example
     *  // Load an the titlescreen background into the scene.
     *  const picture = await Picture2D.createWithID(null,null,null);
     *  @async
     */
    async load() {
        this.loading = false;
    }

    /** 
     *  Translate the scene if possible.
     */
    translate() {}

    /**
     *  Update all the reaction interpreters from the scenes. 
     */
    updateInterpreters() {
        // Index of all the finished parallel reactions
        let endingReactions = new Array;

        // Updating blocking hero
        ReactionInterpreter.blockingHero = false;
        let reaction: ReactionInterpreter;
        for (reaction of this.reactionInterpreters) {
            if (reaction.currentReaction.blockingHero) {
                ReactionInterpreter.blockingHero = true;
                break;
            }
        }

        // Updating all reactions
        let effectIndex: number, i: number, l: number;
        for (i = 0, l = this.reactionInterpreters.length; i < l; i++) {
            reaction = this.reactionInterpreters[i];
            reaction.update();
            if (reaction.isFinished()) {
                reaction.updateFinish();
                endingReactions.push(i);
                effectIndex = this.reactionInterpretersEffects.indexOf(reaction);
                if (effectIndex !== -1) {
                    this.reactionInterpretersEffects.splice(effectIndex, 1);
                }
            }
            // If changed map, STOP
            if (!Scene.Map.current || Manager.Stack.top.loading) {
                break;
            }
        }

        // Deleting finished reactions
        for (i = endingReactions.length - 1; i >= 0; i--) {
            this.reactionInterpreters.splice(endingReactions[i], 1);
        }
    }

    /**
     *  Update all the parallel commands from the scenes.
     */
    updateParallelCommands() {
        let endingCommands = new Array; // Index of all the finished commands
        let i: number, l: number, previousCommand: Node, command: Node;
        for (i = 0, l = this.parallelCommands.length; i < l; i++) {
            previousCommand = this.parallelCommands[i].currentCommand;
            command = this.parallelCommands[i].updateCommand();
            if (previousCommand !== command) {
                endingCommands.push(i);
            }
        }
        for (i = endingCommands.length - 1; i >= 0; i--) {
            this.parallelCommands.splice(endingCommands[i], 1);
        }
    }

    /**
     * Add a reaction in the interpreter list.
     *
     * @param {MapObject} sender - The reaction sender
     * @param {System.Reaction} reaction - The reaction to add
     * @param {MapObject} object - The object reacting
     * @param {number} state - the state ID
     * @param {System.DynamicValue[]} parameters - All the parameters coming with this reaction
     * @param {[System.Event, number]} - event the time events values
     * @param {boolean} [moving=false] - indicate if the command is of type moving.
     * @return {ReactionInterpreter}
     */
    addReaction(sender: MapObject, reaction: System.Reaction, object: MapObject,
        state: number, parameters: System.DynamicValue[], event: [System.Event,
            number], moving: boolean = false): ReactionInterpreter {
        if (reaction.getFirstCommand() !== null) {
            let excecuted = false;
            let reactionInterpreter: ReactionInterpreter;
            for (reactionInterpreter of this.reactionInterpreters) {
                if (reactionInterpreter.currentMapObject === object &&
                    reactionInterpreter.currentReaction === reaction) {
                    excecuted = true;
                    break;
                }
            }
            if (!excecuted) {
                reactionInterpreter = new ReactionInterpreter(sender, reaction,
                    object, state, parameters, event);
                this.reactionInterpreters.push(reactionInterpreter);
                if (!moving) {
                    if (object.movingState !== null) {
                        object.movingState.pause = true;
                    }
                }

                return reactionInterpreter;
            }
        }
        return null;
    }

    /**
     * Update the scene.
     */
    update() {
        // Parallel reactions
        this.updateInterpreters.call(this);
        // Parallel commands
        this.updateParallelCommands.call(this);
        // FPS
        if (this.graphicFPS) {
            this.graphicFPS.setText("" + Main.FPS + "FPS");
        }
    }

    /**
     *  Handle the scene reactions when a key is pressed.
     *  @param {number} key - the key ID
     */
    onKeyPressed(key: number) {
        for (let reaction of this.reactionInterpreters) {
            reaction.onKeyPressed(key);
        }
    }

    /**
     *  Handle the scene reactions when a key is released.
     *  @param {number} key - the key ID
     */
    onKeyReleased(key: number) {
        for (let reaction of this.reactionInterpreters) {
            reaction.onKeyReleased(key);
        }
    }

    /**
     *  Handle the scene reactions when a key is repeated.
     *  @param {number} key - The key ID
     *  @return {boolean}
     */
    onKeyPressedRepeat(key: number): boolean {
        for (let reaction of this.reactionInterpreters) {
            reaction.onKeyPressedRepeat(key);
        }
        return true;
    }

    /**
     *  Handle scene reactions when a key is pressed and repeated.
     *  @param {number} key
     *  @return {boolean}
     */
    onKeyPressedAndRepeat(key: number): boolean {
        for (let reaction of this.reactionInterpreters) {
            reaction.onKeyPressedAndRepeat(key);
        }
        return true;
    }

    /** 
     *  Mouse down handle for the scene.
     *  @param {number} x - The x mouse position on screen
     *  @param {number} y - The y mouse position on screen
     */
    onMouseDown(x: number, y: number) {
        for (let reaction of this.reactionInterpreters) {
            reaction.onMouseDown(x, y);
        }
    }

    /** 
     *  Mouse move handle for the scene.
     *  @param {number} x - The x mouse position on screen
     *  @param {number} y - The y mouse position on screen
     */
    onMouseMove(x: number, y: number) {
        for (let reaction of this.reactionInterpreters) {
            reaction.onMouseMove(x, y);
        }
    }

    /** 
     *  Mouse up handle for the scene.
     *  @param {number} x - The x mouse position on screen
     *  @param {number} y - The y mouse position on screen
     */
    onMouseUp(x: number, y: number) {
        for (let reaction of this.reactionInterpreters) {
            reaction.onMouseUp(x, y);
        }
    }

    /**
     *  Draw the contents in the 3D scene.
     */
    draw3D() {}

    /**
     *  Draw the HUD contents on the scene.
     */
    drawHUD() {
        for (let reaction of this.reactionInterpreters) {
            reaction.drawHUD();
        }
        for (let command of this.parallelCommands) {
            command.drawHUD();
        }
        // Draw FPS
        if (this.graphicFPS) {
            this.graphicFPS.draw();
        }
    }

    /**
     *  Close the scene.
     */
    close() {}
}

export { Base }