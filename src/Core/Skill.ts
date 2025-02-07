/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

/** @class
 *  A skill learned by a player.
 *  @param {number} id - The ID of the skill
 */
class Skill {

    public id: number;

    constructor(id: number) {
        this.id = id;
    }
}

export { Skill }