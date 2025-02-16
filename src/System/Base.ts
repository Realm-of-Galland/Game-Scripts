/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/


/**
 *  The superclass that define all the System classes structure.
 *  @abstract
 *  @param {Record<string, any>} - [json=undefined]
 *  @param {any} args
 */
abstract class Base {

    protected constructor(json = undefined, ...args: any) {
        this.setup(args);
        if (json) {
            this.read(json);
        }
    }

    /** 
     *  Assign the members
     *  @note was used due to Super calling method overwriting data with 
     *  inheritance call;
     *  @fix adjusted the args parameters to be flexible and accepts arguments
     */
    setup(...args: any): void
    {
        
    }

    /**
     *  Read the json data
     *  @param {Record<string, any>} - json
     */
    abstract read(json: Record<string, any>): void;
}

export { Base }