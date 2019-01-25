/*
    RPG Paper Maker Copyright (C) 2017 Marie Laporte

    This file is part of RPG Paper Maker.

    RPG Paper Maker is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    RPG Paper Maker is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Foobar.  If not, see <http://www.gnu.org/licenses/>.
*/

// -------------------------------------------------------
//
//  CLASS SceneBattle
//
//  Step 2 :
//      SubStep 0 : Animation and/or moving user
//      SubStep 1 : Damages
//      SubStep 2 : Back to position
//
// -------------------------------------------------------

SceneBattle.prototype.initializeStep2 = function(){
    var i, l;
    this.windowTopInformations.content = new GraphicText("Attack");
    this.time = new Date().getTime();
    var damages = 3;
    l = this.targets.length;
    this.textsDamages = new Array(l);
    for (i = 0; i < l; i++){
        var t = this.targets[i].character;
        t.hp -= damages;
        if (t.hp < 0) t.hp = 0;
        this.textsDamages[i] = [damages, this.targets[i]];
    }
    this.user.setAttacking();
};

// -------------------------------------------------------

SceneBattle.prototype.updateStep2 = function() {
    var i, l;

    if (!this.user.isAttacking()) {
        for (i = 0, l = this.targets.length; i < l; i++) {
            this.targets[i].setAttacked();
        }
    }

    if (new Date().getTime() - this.time >= 2000) {
        this.user.setActive(false);
        this.user.selected = false;

        // Target and user test death
        this.user.updateDead();
        for (i = 0, l = this.targets.length; i < l; i++) {
            this.targets[i].updateDead();
        }

        // Testing end of battle
        if (this.isWin()) {
            this.activeGroup();
            this.changeStep(4);
        } else if (this.isLose()) {
            this.gameOver();
        } else {
            // Testing end of turn
            if (this.isEndTurn()) {
                this.activeGroup();
                if (this.attackingGroup === CharacterKind.Hero) {
                    this.changeStep(3); // Attack of ennemies
                } else {
                    this.changeStep(1); // Attack of heroes
                }
            } else {
                if (this.attackingGroup === CharacterKind.Hero) {
                    this.changeStep(1); // Attack of heroes
                } else {
                    this.changeStep(3); // Attack of ennemies
                }
            }
        }
    }
};

// -------------------------------------------------------

SceneBattle.prototype.onKeyPressedStep2 = function(key){

};

// -------------------------------------------------------

SceneBattle.prototype.onKeyReleasedStep2 = function(key){

};

// -------------------------------------------------------

SceneBattle.prototype.onKeyPressedRepeatStep2 = function(key){

};

// -------------------------------------------------------

SceneBattle.prototype.onKeyPressedAndRepeatStep2 = function(key){

};

// -------------------------------------------------------

SceneBattle.prototype.drawHUDStep2 = function(){
    this.windowTopInformations.draw();

    // Draw damages
    if (!this.user.isAttacking()) {
        var i, l = this.textsDamages.length;
        var target, pos, damage;
        for (i = 0; i < l; i++){
            damage = this.textsDamages[i][0];
            target = this.textsDamages[i][1];
            target.drawDamages(damage, false, false);
        }
    }
};
