/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { Datas, Manager, System } from "..";
import { Utils } from "../Common";
import { MapObject } from "../Core";
import { Base } from "./Base";

/** @class
 *  An event command for playing a video.
 *  @extends EventCommand.Base
 *  @param {any[]} command - Direct JSON command to parse
 */
class PlayAVideo extends Base {

    public videoID: number;
    public operation: number;
    public isStart: boolean;
    public start: System.DynamicValue;
    public isWaitEnd: boolean = true;

    constructor(command: any[]) {
        super();

        let iterator = {
            i: 0
        };
        this.operation = command[iterator.i++];
        if (this.operation === 0) {
            this.videoID = command[iterator.i++];
            this.isStart = Utils.numToBool(command[iterator.i++]);
            if (this.isStart) {
                this.start = System.DynamicValue.createValueCommand(command, iterator);
            }
            this.isWaitEnd = Utils.numToBool(command[iterator.i++]);
        }
        this.parallel = !this.isWaitEnd;
    }

    /** 
     *  Initialize the current state.
     *  @returns {Record<string, any>} The current state
     */
    initialize(): Record<string, any> {
        return {
            parallel: this.isWaitEnd,
            started: false,
            finished: false
        }
    }

    /** 
     *  Update and check if the event is finished.
     *  @param {Record<string, any>} - currentState The current state of the event
     *  @param {MapObject} object - The current object reacting
     *  @param {number} state - The state ID
     *  @returns {number} The number of node to pass
    */
    update(currentState: Record<string, any>, object: MapObject, state: number): 
        number
    {
        if (currentState.parallel) {
            if (!currentState.started) {
                switch (this.operation) {
                    case 0:
                        Manager.Videos.play(Datas.Videos.get(this.videoID)
                            .getPath() + (this.isStart ? "#t=" + this.start
                            .getValue() : ""), () => {
                                Manager.Videos.stop();
                                currentState.finished = true;
                            }
                        );
                        break;
                    case 1:
                        Manager.Videos.pause();
                        currentState.finished = true;
                        break;
                    case 2:
                        Manager.Videos.stop();
                        currentState.finished = true;
                        break;
                }
                currentState.started = true;
            }
            return currentState.finished ? 1 : 0;
        }
        return 1;
    }
}

export { PlayAVideo }