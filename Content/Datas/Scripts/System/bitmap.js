/*
    RPG Paper Maker Copyright (C) 2017-2019 Marie Laporte

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
//  CLASS Bitmap
//
// -------------------------------------------------------

/** @class
*   A bitmap is something that can be drawn on the HUD. It can be a window,
*   a text, an image...
*   @property {number} x Coords of the bitmap.
*   @property {number} y Coords of the bitmap.
*   @property {number} w Coords of the bitmap.
*   @property {number} h Coords of the bitmap.
*   @param {number} [x=0] - Coords of the bitmap.
*   @param {number} [y=0] - Coords of the bitmap.
*   @param {number} [w=0] - Coords of the bitmap.
*   @param {number} [h=0] - Coords of the bitmap.
*/
function Bitmap(x, y, w, h){

    // Default values
    if (typeof x === 'undefined') x = 0;
    if (typeof y === 'undefined') y = 0;
    if (typeof w === 'undefined') w = 0;
    if (typeof h === 'undefined') h = 0;

    Bitmap.prototype.setX.call(this, x);
    Bitmap.prototype.setY.call(this, y);
    Bitmap.prototype.setW.call(this, w);
    Bitmap.prototype.setH.call(this, h);
}

Bitmap.prototype = {

    /** Set the x value.
    *   @param {number} x The x value.
    */
    setX: function(x){
        this.x = RPM.getScreenX(x);
        $requestPaintHUD = true;
    },

    // -------------------------------------------------------

    /** Set the y value.
    *   @param {number} y The y value.
    */
    setY: function(y){
        this.y = RPM.getScreenY(y);
        $requestPaintHUD = true;
    },

    // -------------------------------------------------------

    /** Set the w value.
    *   @param {number} w The w value.
    */
    setW: function(w){
        this.w = RPM.getScreenX(w);
        $requestPaintHUD = true;
    },

    // -------------------------------------------------------

    /** Set the h value.
    *   @param {number} h The h value.
    */
    setH: function(h){
        this.h = RPM.getScreenY(h);
        $requestPaintHUD = true;
    },

    // -------------------------------------------------------

    /** Set the position to the top.
    */
    setLeft: function() {
        this.x = 0;
        $requestPaintHUD = true;
    },

    // -------------------------------------------------------

    /** Set the position to the top.
    */
    setTop: function() {
        this.y = 0;
        $requestPaintHUD = true;
    },

    // -------------------------------------------------------

    /** Set the position to the top.
    */
    setRight: function(offset) {
        this.x = $SCREEN_X - this.w - (offset ? offset : 0);
        $requestPaintHUD = true;
    },

    // -------------------------------------------------------

    /** Set the position to the top.
    */
    setBot: function(offset) {
        this.y = $SCREEN_Y - this.h - (offset ? offset : 0);
        $requestPaintHUD = true;
    },

    // -------------------------------------------------------

    /** Set all the coords values.
    *   @param {number} x The x value.
    *   @param {number} y The y value.
    *   @param {number} w The w value.
    *   @param {number} h The h value.
    */
    setCoords: function(x, y, w, h){
        this.setX(x);
        this.setY(y);
        this.setW(w);
        this.setH(h);
    }
}
