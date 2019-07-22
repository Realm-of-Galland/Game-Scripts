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
//  CLASS DatasSystem
//
// -------------------------------------------------------

/** @class
*   All the system datas.
*   @property {string[]} itemsTypes List of all the possible types of items of
*   the game according to ID.
*   @property {number} idMapStartHero Id of the map where the hero is in the
*   beginning of a game.
*   @property {number} idObjectStartHero Id of the object where the hero is in
*   the beginning of a game.
*   @property {SystemCurrency[]} currencies List of all the currencies of the
*   game according to ID.
*/
function DatasSystem(){
    this.read();
}

DatasSystem.prototype = {

    /** Read the JSON file associated to system.
    */
    read: function(){
        RPM.openFile(this, RPM.FILE_SYSTEM, true, function(res){
            var json = JSON.parse(res);
            var jsonItemsTypes = json.itemsTypes;
            var i, l = jsonItemsTypes.length, id, w, h, isScreenWindow;
            this.itemsTypes = new Array(l+1);
            for (i = 0; i < l; i++) {
                this.itemsTypes[jsonItemsTypes[i].id] = {
                    name: jsonItemsTypes[i].name
                };
            }

            // Project name
            this.projectName = new SystemLang();
            this.projectName.readJSON(json.pn);
            $window.title = this.projectName.name;

            // Screen resolution
            w = json.sw;
            h = json.sh;
            isScreenWindow = json.isw;
            if (!isScreenWindow) {
                $window.visibility = "FullScreen";
                w = $screenWidth;
                h = $screenHeight;
            }
            $window.width = w;
            $window.maximumWidth = w;
            $window.minimumWidth = w;
            $window.height = h;
            $window.maximumHeight = h;
            $window.minimumHeight = h;
            $window.setX($screenWidth / 2 - w / 2);
            $window.setY($screenHeight / 2 - h / 2);
            $canvasHUD.width = w;
            $canvasHUD.height = h;
            $canvas3D.width = w;
            $canvas3D.height = h;
            $canvasWidth = w;
            $canvasHeight = h;
            $windowX = $canvasWidth / $SCREEN_X;
            $windowY = $canvasHeight / $SCREEN_Y;
            $context.width = w;
            $context.height = h;
            resizeGL($canvas3D);
            $loadingScene.text.updateFont();
            $requestPaintHUD = true;

            // Other numbers
            $SQUARE_SIZE = json.ss;
            //$PORTIONS_RAY_NEAR = json.pr;
            $PORTIONS_RAY_NEAR = 3;
            $FRAMES = json.frames;
            this.mountainCollisionHeight = SystemValue.readOrDefaultNumber(json
                .mch, 8);
            this.mountainCollisionAngle = SystemValue.readOrDefaultNumberDouble(
                json.mca, 45);

            // Path BR
            RPM.PATH_BR = "file:///" + json.pathBR + "/";

            // Hero beginning
            this.idMapStartHero = json.idMapHero;
            this.idObjectStartHero = json.idObjHero;
            this.getModelHero();

            // Debug
            this.showBB = (typeof json.bb !== 'undefined');
            if (this.showBB) {
                $BB_MATERIAL.color.setHex(0xff0000);
                $BB_MATERIAL.wireframe = true;
                $BB_MATERIAL.visible = true;
            }

            // Colors
            var jsonColors = json.colors;
            l = jsonColors.length;
            this.colors = new Array(l + 1);
            for (i = 0; i < l; i++){
                var jsonColor = jsonColors[i];
                id = jsonColor.id;
                var color = new SystemColor();
                color.readJSON(jsonColor);
                this.colors[id] = color;
            }

            // Currencies
            var jsonCurrencies = json.currencies;
            l = jsonCurrencies.length;
            this.currencies = new Array(l + 1);
            for (i = 0; i < l; i++){
                var jsonCurrency = jsonCurrencies[i];
                id = jsonCurrency.id;
                var currency = new SystemCurrency();
                currency.readJSON(jsonCurrency);
                this.currencies[id] = currency;
            }

            // WindowSkins
            var jsonWindowSkins = json.wskins;
            l = jsonWindowSkins.length;
            this.windowSkins = new Array(l + 1);
            for (i = 0; i < l; i++){
                var jsonWindowSkin = jsonWindowSkins[i];
                id = jsonWindowSkin.id;
                var windowSkin = new SystemWindowSkin();
                windowSkin.readJSON(jsonWindowSkin);
                this.windowSkins[id] = windowSkin;
            }
            this.idWindowSkin = json.wskin;

            // read song now that BR path is loaded
            $datasGame.songs.read();
        });
    },

    // -------------------------------------------------------

    /** Update the $modelHero global variable by loading the hero model.
    */
    getModelHero: function(){
        var mapName = RPM.generateMapName(this.idMapStartHero);
        RPM.openFile(null, RPM.FILE_MAPS + mapName + RPM.FILE_MAP_OBJECTS,
                       true, function(res)
        {
            var json = JSON.parse(res).objs;
            var i, l;

            var jsonObject;
            l = json.length;
            var id = $datasGame.system.idObjectStartHero;
            var position;
            for (i = 0; i < l; i++){
                jsonObject = json[i];
                if (jsonObject.id === id){
                    position = jsonObject.p;
                    break;
                }
            }
            var globalPortion = SceneMap.getGlobalPortion(position);

            var fileName = SceneMap.getPortionName(globalPortion[0],
                                                   globalPortion[1],
                                                   globalPortion[2]);

            RPM.openFile(null, RPM.FILE_MAPS + mapName + "/" + fileName,
                           false, function(res){
                var json = JSON.parse(res);
                var mapPortion = new MapPortion(globalPortion[0],
                                                globalPortion[1],
                                                globalPortion[2]);

                // Update the hero model
                $modelHero = mapPortion.getHeroModel(json);
            });
        });
    },

    // -------------------------------------------------------

    loadWindowSkins: function() {
        for (var i = 1, l = this.windowSkins.length; i < l; i++) {
            this.windowSkins[i].updatePicture();
        }
    },

    // -------------------------------------------------------

    /** Get the default array currencies for a default game.
    *   @returns {number[]}
    */
    getDefaultCurrencies: function(){
        var i, l = this.currencies.length;
        var list = new Array(l);

        for (i = 1; i < l; i++) {
            list[i] = 0;
        }

        return list;
    },

    // -------------------------------------------------------

    getWindowSkin: function() {
        return this.windowSkins[this.idWindowSkin];
    }
}
