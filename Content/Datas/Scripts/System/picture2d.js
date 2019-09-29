/*
    RPG Paper Maker Copyright (C) 2017-2019 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

// -------------------------------------------------------
//
//  CLASS Picture2D < Bitmap
//
// -------------------------------------------------------

/** @class
*   A class for pictures drawable in HUD.
*   @extends Bitmap
*   @property {string} path The path to the ressource.
*   @property {function} callback Function to call after the image is loaded.
*   @param {string} path The path to the ressource.
*   @param {function} callback Function to call after the image is loaded.
*   @param {number} [x=0] - Coords of the bitmap.
*   @param {number} [y=0] - Coords of the bitmap.
*   @param {number} [w=0] - Coords of the bitmap.
*   @param {number} [h=0] - Coords of the bitmap.
*/
function Picture2D(path, callback, x, y, w, h) {
    Bitmap.call(this, x, y, w, h);

    if (path) {
        this.path = path;
        this.callback = callback;
        this.checked = false;
        this.empty = false;

        $picturesLoading.push(this);
        $canvasRendering.loadImage(path);
    } else {
        this.empty = true;
    }
}

// -------------------------------------------------------

Picture2D.createImage = function(image, kind, callback, x, y, w, h) {
    return image ? new Picture2D(image.getPath(kind)[1], callback, x, y, w, h) :
        new Picture2D();
}

// -------------------------------------------------------

Picture2D.createImageWithID = function(id, kind, callback, x, y, w, h) {
    return Picture2D.createImage($datasGame.pictures.get(kind, id), kind,
        callback, x, y, w, h);
}

// -------------------------------------------------------

Picture2D.prototype = Object.create(Bitmap.prototype);

// -------------------------------------------------------

Picture2D.prototype.check = function() {
    if ($canvasRendering.isImageLoaded(this.path)) {
        var context = $canvasRendering.getContext('2d');
        $picturesLoading.splice($picturesLoading.indexOf(this), 1);
        $picturesLoaded.push(this);
        this.image = context.createImageData(this.path);
        Bitmap.prototype.setW.call(this, this.image.width);
        Bitmap.prototype.setH.call(this, this.image.height);

        if (this.callback) {
            this.callback.call(this);
        }
        this.checked = true;
        $requestPaintHUD = true;
        return true;
    }
    if (this.empty) {
        Bitmap.prototype.setW.call(this, 1);
        Bitmap.prototype.setH.call(this, 1);
        this.checked = true;
        $requestPaintHUD = true;
        return true;
    }

    return false;
};

// -------------------------------------------------------

Picture2D.prototype.destroy = function() {
    $canvasRendering.unloadImage(this.path);
};

// -------------------------------------------------------

Picture2D.prototype.draw = function(x, y, w, h, sx, sy, sw, sh, positionResize)
{
    if (!this.checked) {
        this.check();
    }

    // Default values
    if (typeof positionResize === 'undefined') {
        positionResize = true;
    }
    if (typeof x === 'undefined') {
        x = this.x;
    } else {
        if (positionResize) {
            x = RPM.getScreenX(x);
        }
    }
    if (typeof y === 'undefined') {
        y = this.y;
    } else {
        if (positionResize) {
            y = RPM.getScreenY(y);
        }
    }
    if (typeof w === 'undefined') {
        w = this.w;
    } else {
        w = RPM.getScreenX(w);
    }
    if (typeof h === 'undefined') {
        h = this.h;
    } else {
        h = RPM.getScreenY(h);
    }
    if (typeof sx === 'undefined') sx = 0;
    if (typeof sy === 'undefined') sy = 0;
    if (typeof sw === 'undefined') sw = this.oW;
    if (typeof sh === 'undefined') sh = this.oH;

    if (sw <= 0 || sh <= 0) {
        return;
    }

    // Draw the image
    if (!this.empty) {
        if (this.reverse) {
            $context.save();
            $context.scale(-1, 1);
            $context.drawImage(this.path, sx, sy, sw, sh, -x - w, y, w, h);
            $context.restore();
        } else {
            $context.drawImage(this.path, sx, sy, sw, sh, x, y, w, h);
        }
    }
};
