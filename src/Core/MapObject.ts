/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { THREE } from "../Globals";
import { System, EventCommand, Manager, Datas, Scene } from "../index";
import { Frame } from "./Frame";
import { Enum, Utils, IO, Paths, Constants, Platform, Mathf } from "../Common";
import Orientation = Enum.Orientation;
import ElementMapKind = Enum.ElementMapKind;
import PictureKind = Enum.PictureKind;
import ObjectMovingKind = Enum.ObjectMovingKind;
import ShapeKind = Enum.ShapeKind;
import { MapPortion } from "./MapPortion";
import { Sprite } from "./Sprite";
import { Position } from "./Position";
import { CollisionSquare } from "./CollisionSquare";
import { MapElement, StructMapElementCollision } from "./MapElement";
import { Vector3 } from "./Vector3";
import { Game } from "./Game";
import { Object3DBox } from "./Object3DBox";
import { Object3DCustom } from "./Object3DCustom";
import { CustomGeometry } from "./CustomGeometry";
import { Vector2 } from "./Vector2";
import { Portion } from "./Portion";

interface StructSearchResult {
    object: MapObject,
    id: number,
    datas: Record<string, any>,
    kind?: number,
    index?: number,
    list?: MapObject[]
}

/**
 * Object in local map that can move.
 *
 * @class MapObject
 */
class MapObject {
    
    public static SPEED_NORMAL = 0.004666;

    public id: number;
    public system: System.MapObject;
    public position: Vector3;
    public isHero: boolean;
    public movingState: Record<string, any>;
    public previousPosition: Vector3;
    public mesh: THREE.Mesh;
    public meshBoundingBox: THREE.Mesh[];
    public currentBoundingBox: THREE.Mesh;
    public boundingBoxSettings: Record<string, any>;
    public frame: Frame;
    public orientationEye: Orientation;
    public orientation: Orientation;
    public width: number;
    public height: number;
    public moving: boolean;
    public moveFrequencyTick: number;
    public isStartup: boolean;
    public isInScene: boolean;
    public receivedOneEvent: boolean;
    public previousOrientation: Orientation;
    public otherMoveCommand: EventCommand.MoveObject;
    public previousMoveCommand:EventCommand.MoveObject;
    public yMountain: number;
    public speed: System.DynamicValue;
    public frequency: System.DynamicValue;
    public properties: any[];
    public states: number[];
    public statesInstance: Record<string, any>[];
    public timeEventsEllapsed: [System.Event, number][];
    public currentState: System.State;
    public currentStateInstance: Record<string, any>;
    public removed: boolean;
    public upPosition: Vector3;
    public halfPosition: Vector3;
    public currentOrientationStop: boolean;
    public terrain: number;

    constructor(system: System.MapObject, position?: Vector3, isHero: boolean = 
        false)
    {
        this.system = system;
        this.id = system.id;
        this.position = position;
        this.isHero = isHero;
        this.previousPosition = position;
        this.mesh = null;
        this.meshBoundingBox = null;
        this.currentBoundingBox = null;
        this.boundingBoxSettings = null;
        this.frame = new Frame(0);
        this.orientationEye = Orientation.South;
        this.orientation = this.orientationEye;
        this.width = 1;
        this.height = 1;
        this.moving = false;
        this.moveFrequencyTick = 0;
        this.isStartup = Utils.isUndefined(position);
        this.isInScene = false;
        this.receivedOneEvent = false;
        this.movingState = null;
        this.previousOrientation = null;
        this.otherMoveCommand = null;
        this.yMountain = null;
        this.currentOrientationStop = false;
        if (!this.isHero) {
            this.initializeProperties();
        }
        this.initializeTimeEvents();
    }

    /** 
     *  Search an object in the map.
     *  @static
     *  @param {number} objectID - The object ID searched
     */
    static search(objectID: number, callback: Function, thisObject?: MapObject) {
        let result = this.searchInMap(objectID, thisObject);
        if (result === null) {
            (async() => {
                result = await this.searchOutMap(objectID);
                callback.call(null, result);
            })();
        } else {
            callback.call(null, result);
        }
    }

    /** 
     *  Search an object that is already loaded. Return null if not found.
     *  @static
     *  @param {number} objectID - The object ID searched
     *  @param {MapObject} object - This object
     *  @returns {Promise<StructSearchResult>}
     */
    static searchInMap(objectID: number, thisObject?: MapObject): StructSearchResult {
        let object = null;
        switch (objectID) {
            case -1: // This object
                objectID = thisObject.system.id;
                if (thisObject.isInScene) {
                    object = thisObject;
                }
                if (thisObject.isHero || thisObject.isStartup) {
                    return {
                        object: thisObject,
                        id: objectID,
                        datas: null
                    };
                }
                break;
            case 0: // Hero
                return {
                    object: Game.current.hero,
                    id: Game.current.hero.system.id,
                    datas: null
                };
            default:
                break;
        }

        // Check if direct
        let position = Scene.Map.current.allObjects[objectID];
        if (!position) { // If cannot find, inform that the object doesn't exist in the map
            Platform.showErrorMessage("Can't find object with ID" + objectID + 
            " in map " +  Scene.Map.current.mapName + ". Please check where " +
            "this ID is used and remove it.");
        }
        let globalPortion = position.getGlobalPortion();
        let mapsDatas = Game.current.getPortionDatas(Scene.Map.current.id, 
            globalPortion);
        if (object !== null) {
            return {
                object: object,
                id: objectID,
                datas: mapsDatas
            };
        }

        // First search in the moved objects
        let movedObjects = mapsDatas.m;
        let moved = null;
        let i: number, l: number;
        for (i = 0, l = movedObjects.length; i < l; i++) {
            if (movedObjects[i].system.id === objectID) {
                moved = movedObjects[i];
                break;
            }
        }
        if (moved !== null) {
            return {
                object: moved,
                id: objectID,
                kind: 0,
                index: i,
                list: null,
                datas: mapsDatas
            };
        }

        // If not moving, search directly in portion
        let localPortion = Scene.Map.current.getLocalPortion(globalPortion);
        let mapPortion: MapPortion;
        if (Scene.Map.current.isInPortion(localPortion)) {
            mapPortion = Scene.Map.current.getMapPortion(localPortion);
            let objects = mapPortion.objectsList;
            for (i = 0, l = objects.length; i < l; i++) {
                if (objects[i].system.id === objectID) {
                    moved = objects[i];
                    break;
                }
            }
            if (moved === null) {
                return {
                    object: Game.current.hero,
                    id: objectID,
                    kind: 1,
                    index: -1,
                    list: null,
                    datas: mapsDatas
                }
            } else {
                return {
                    object: moved,
                    id: objectID,
                    kind: 1,
                    index: i,
                    list: objects,
                    datas: mapsDatas
                }
            }
        } else { // Load the file if not already in temp
            return null;
        }
    }

    /** 
     *  Search an object that is not loaded yet.
     *  @static
     *  @param {number} objectID - The object ID searched
     *  @returns {Promise<StructSearchResult>}
     */
    static async searchOutMap(objectID: number): Promise<StructSearchResult> {
        let globalPortion = Scene.Map.current.allObjects[objectID]
            .getGlobalPortion();
        let mapsDatas = Game.current.getPortionDatas(Scene.Map.current.id, 
            globalPortion);
        let json = await IO.parseFileJSON(Paths.FILE_MAPS + Scene.Map.current
            .mapName + Constants.STRING_SLASH + globalPortion.getFileName());
        let mapPortion = new MapPortion(globalPortion);
        let moved = mapPortion.getObjFromID(json, objectID);
        if (moved === null) {
            return {
                object: Game.current.hero,
                id: objectID,
                kind: 2,
                index: -1,
                list: null,
                datas: mapsDatas
            }
        } else {
            return {
                object: moved,
                id: objectID,
                kind: 2,
                index: -1,
                list: null,
                datas: mapsDatas
            }
        }
    }

    /** 
     *  Read the JSON associated to the object.
     *  @param {Record<string, any>} json - Json object describing the object
     */
    read(json: Record<string, any>) {
        this.position = Position.createFromArray(json.k).toVector3();
        this.system = new System.MapObject(json.v);
    }

    /** 
     *  Initialize objet properties.
     */
    initializeProperties() {
        let mapProp: number[], mapStatesOpts: Record<string, any>[];
        if (this.isHero) {
            mapProp = Game.current.heroProperties;
            mapStatesOpts = Game.current.heroStatesOptions;
        } else if (this.isStartup) {
            mapProp = Game.current.startupProperties[Scene.Map.current.id];
            mapStatesOpts = [];
            if (Utils.isUndefined(mapProp)) {
                mapProp = [];
            }
        } else {
            let obj = Scene.Map.current.allObjects[this.system.id];
            if (Utils.isUndefined(obj)) {
                Platform.showErrorMessage("Can't find object with name" + this
                    .system.name + " and ID " + this.system.id + " in map " + 
                    Scene.Map.current.mapName +
                    " in object linking. Please open the map, check where is the object and save.");
            }
            let portion = obj.getGlobalPortion();
            let portionDatas = Game.current.getPortionDatas(Scene.Map.current.id, 
                portion);
            let indexProp = -1;
            if (portionDatas.pi) {
                indexProp = portionDatas.pi.indexOf(this.system.id);
            }
            mapProp = (indexProp === -1) ? [] : portionDatas.p[indexProp];
            indexProp = -1;
            if (portionDatas.soi) {
                indexProp = portionDatas.soi.indexOf(this.system.id);
            }
            mapStatesOpts = (indexProp === -1) ? [] : portionDatas.so[indexProp];
        }

        // Properties
        this.properties = [];
        let i: number, l: number, prop: System.Property, propValue: any;
        for (i = 0, l = this.system.properties.length; i < l; i++) {
            prop = this.system.properties[i];
            propValue = mapProp[prop.id - 1];
            this.properties[prop.id] = Utils.defaultValue(propValue, prop
                .initialValue.getValue());
        }

        // States
        this.statesInstance = [];
        let stateSystem: System.State, stateValue: any, state: any;
        for (i = 0, l = this.system.states.length; i < l; i++) {
            stateSystem = this.system.states[i];
            stateValue = mapStatesOpts[stateSystem.id - 1];
            state = stateSystem.copyInstance();
            this.statesInstance[i] = state;
            if (!Utils.isUndefined(stateValue)) {
                state.graphicID = Utils.defaultValue(stateValue.gid, stateSystem.graphicID);
                state.graphicKind = Utils.defaultValue(stateValue.gk, stateSystem.graphicKind);
                state.rectTileset = Utils.defaultValue(stateValue.gt, stateSystem.rectTileset);
                state.indexX = Utils.defaultValue(stateValue.gix, stateSystem.indexX);
                state.indexY = Utils.defaultValue(stateValue.giy, stateSystem.indexY);
                state.speedID = Utils.defaultValue(stateValue.sid, stateSystem.speedID);
                state.frequencyID =  Utils.defaultValue(stateValue.fid, stateSystem.frequencyID);
                state.moveAnimation = Utils.defaultValue(stateValue.ma, stateSystem.moveAnimation);
                state.stopAnimation = Utils.defaultValue(stateValue.sa, stateSystem.stopAnimation);
                state.climbAnimation = Utils.defaultValue(stateValue.ca, stateSystem.climbAnimation);
                state.directionFix = Utils.defaultValue(stateValue.df, stateSystem.directionFix);
                state.through = Utils.defaultValue(stateValue.t, stateSystem.through);
                state.setWithCamera = Utils.defaultValue(stateValue.swc, stateSystem.setWithCamera);
                state.pixelOffset = Utils.defaultValue(stateValue.po, stateSystem.pixelOffset);
                state.keepPosition = Utils.defaultValue(stateValue.kp, stateSystem.keepPosition);
            }
        }
    }

    /** 
     *  Initialize time events (reactions to event time).
     */
    initializeTimeEvents() {
        let l = this.system.timeEvents.length;
        this.timeEventsEllapsed = new Array(l);
        for (let i = 0; i < l; i++) {
            this.timeEventsEllapsed[i] = [this.system.timeEvents[i], new Date()
                .getTime()];
        }
    }

    /** 
     *  Update time events.
     */
    updateTimeEvents() {
        // First run detection state
        if (this.currentState && this.currentState.detection !== null) {
            this.currentState.detection.update(null, this, null);
        }

        // Run other time events
        let removeList = [];
        let i: number, l: number, events: [System.Event, number], event: System
            .Event, timeEllapsed: number, interval: System.DynamicValue, repeat: 
            System.DynamicValue;
        for (i = 0, l = this.timeEventsEllapsed.length; i < l; i++) {
            events = this.timeEventsEllapsed[i];
            event = events[0];
            timeEllapsed = events[1];
            interval = event.parameters[1].value;
            if (new Date().getTime() - timeEllapsed >= (interval.getValue() * 1000)) {
                repeat = event.parameters[2].value;
                if (this.receiveEvent(this, true, 1, [null, interval, repeat],
                    this.states, events))
                {
                    if (!repeat.getValue()) {
                        removeList.push(i);
                    }
                } else {
                    return;
                }
            }
        }

        // Remove useless no repeat events
        for (i = removeList.length - 1; i >= 0; i--) {
            this.timeEventsEllapsed.splice(removeList[i], 1);
        }
    }

    /** 
     *  Update the current state (graphics to display), also update the mesh.
     */
    changeState() {
        let angle = this.mesh ? this.mesh.rotation.y : 0;

        // Updating the current state
        if (this.isHero) {
            this.states = Game.current.heroStates;
        } else if (this.isStartup) {
            if (!Game.current.startupStates.hasOwnProperty(Scene.Map.current.id)) {
                Game.current.startupStates[Scene.Map.current.id] = [1];
            }
            this.states = Game.current.startupStates[Scene.Map.current.id];
        } else {
            let pos = Scene.Map.current.allObjects[this.system.id];
            if (Utils.isUndefined(pos)) {
                Platform.showErrorMessage("Can't find object with name" + this
                    .system.name + " and ID " + this.system.id + " in map " + 
                    Scene.Map.current.mapName +
                    " in object linking. Please open the map, check where is the object and save.");
            }
            let portion = pos.getGlobalPortion();
            let portionDatas = Game.current.getPortionDatas(Scene.Map.current.id, 
                portion);
            let indexState = -1;
            if (portionDatas.si) {
                indexState = portionDatas.si.indexOf(this.system.id);
            }
            this.states = (indexState === -1) ? [this.system.states.length > 0 ?
                this.system.states[0].id : 1] : portionDatas.s[indexState];
        }
        let previousStateInstance = this.currentStateInstance;
        this.currentState = null;
        this.currentStateInstance = null;
        this.currentOrientationStop = false;
        let state: System.State;
        for (let i = this.system.states.length - 1; i >= 0; i--) {
            state = this.system.states[i];
            if (this.states.indexOf(state.id) !== -1) {
                this.currentState = state;
                this.currentStateInstance = this.statesInstance[i];
                break;
            }
        }

        // Remove previous mesh
        this.removeFromScene();

        // Update mesh
        if (this.isStartup || !Scene.Map.current.textureTileset) {
            return;
        }
        let material = null;
        let objectDatas: System.Object3D;
        if (this.currentStateInstance !== null) {
            if (this.currentStateInstance.graphicKind === ElementMapKind.Object3D) {
                objectDatas = Datas.SpecialElements.objects[this
                    .currentStateInstance.graphicID];
                material = Scene.Map.current.texturesObjects3D[objectDatas
                    .pictureID];
            } else {
                material = this.currentStateInstance.graphicID === 0 ? Scene.Map
                    .current.textureTileset : Scene.Map.current
                    .texturesCharacters[this.currentStateInstance.graphicID];
            }
        }
        this.meshBoundingBox = new Array;
        let texture = Manager.GL.getMaterialTexture(material);
        if (this.currentState !== null && !this.isNone() && texture) {
            this.speed = Datas.Systems.getSpeed(this.currentStateInstance.speedID);
            this.frequency = Datas.Systems.getFrequency(this.currentStateInstance.frequencyID);
            this.frame.value = this.currentStateInstance.indexX >= Datas.Systems
                .FRAMES ? Datas.Systems.FRAMES - 1 : this.currentStateInstance
                .indexX;
            this.orientationEye = this.currentStateInstance.indexY;
            this.updateOrientation();
            let result: [CustomGeometry, [number, StructMapElementCollision[]]];
            if (this.currentStateInstance.graphicKind === ElementMapKind.Object3D) {
                let objectDatas = Datas.SpecialElements.objects[this
                    .currentStateInstance.graphicID];
                let object3D: Object3DBox;
                switch (objectDatas.shapeKind) {
                    case ShapeKind.Box:
                        object3D = Object3DBox.create(objectDatas);
                        result = object3D.createGeometry(new Position());
                        break;
                    case ShapeKind.Custom:
                        object3D = Object3DCustom.create(objectDatas);
                        result = object3D.createGeometry(new Position());
                        break;
                }
                // Correct position offset (left / top)
                if (!previousStateInstance || previousStateInstance.graphicKind 
                    !== ElementMapKind.Object3D || (!Utils.isUndefined(this
                    .currentStateInstance.previousGraphicKind) && this
                    .currentStateInstance.previousGraphicKind !== ElementMapKind
                    .Object3D)) {
                    this.position.set(this.position.x - (Datas.Systems
                        .SQUARE_SIZE / 2), this.position.y, this.position.z - (
                        Datas.Systems.SQUARE_SIZE / 2));
                }
            } else {
                let x: number, y: number;
                if (this.currentStateInstance.graphicID === 0) {
                    x = this.currentStateInstance.rectTileset[0];
                    y = this.currentStateInstance.rectTileset[1];
                    this.width = this.currentStateInstance.rectTileset[2];
                    this.height = this.currentStateInstance.rectTileset[3];
                } else {
                    x = 0;
                    y = 0;
                    this.width = texture.image.width / Datas.Systems.SQUARE_SIZE / 
                        Datas.Systems.FRAMES;
                    this.height = texture.image.height / Datas.Systems.SQUARE_SIZE / 
                        Datas.Pictures.get(Enum.PictureKind.Characters, this
                        .currentStateInstance.graphicID).getRows();
                    this.currentOrientationStop = this.currentStateInstance.indexY >= 4;
                }
                let sprite = Sprite.create(this.currentStateInstance.graphicKind, [x, y, 
                    this.width, this.height]);
                result = sprite.createGeometry(this.width, this.height, this
                    .currentStateInstance.graphicID === 0, Position
                    .createFromVector3(this.position));
                // Correct position offset (left / top)
                if (previousStateInstance && previousStateInstance.graphicKind 
                    === ElementMapKind.Object3D && (Utils.isUndefined(this
                    .currentStateInstance.previousGraphicKind) || this
                    .currentStateInstance.previousGraphicKind === ElementMapKind
                    .Object3D)) {
                    this.position.set(this.position.x + (Datas.Systems
                        .SQUARE_SIZE / 2), this.position.y, this.position.z + (
                        Datas.Systems.SQUARE_SIZE / 2));
                }
            }
            let geometry = result[0];
            let objCollision = result[1];
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.set(this.position.x, this.position.y, this
                .position.z);
            this.boundingBoxSettings = objCollision[1][0];
            if (this.boundingBoxSettings) {
                if (this.currentStateInstance.graphicID === 0) {
                    let picture = Scene.Map.current.mapProperties.tileset
                        .picture;
                    this.boundingBoxSettings.squares = picture ? picture
                        .getSquaresForTexture(this.currentStateInstance.rectTileset)
                        : [];
                }
                if (this.currentStateInstance.graphicKind === ElementMapKind.Object3D) {
                    this.boundingBoxSettings.b = [this.boundingBoxSettings.b];
                }
                this.updateBB(this.position);
            } else {
                this.boundingBoxSettings = null;
            }
            this.updateUVs();
            this.updateAngle(angle);
        } else {
            this.mesh = null;
            this.boundingBoxSettings = null;
            this.speed = this.currentState === null ? System.DynamicValue
                .createNumberDouble(1) : Datas.Systems.getSpeed(this
                .currentStateInstance.speedID);
            this.frequency = this.currentState === null ? System.DynamicValue
                .createNumberDouble(0) : Datas.Systems.getFrequency(this
                .currentStateInstance.frequencyID);
            this.width = 0;
            this.height = 0;
        }

        this.updateTerrain();

        // Add to the scene
        this.addToScene();
    }

    /** 
     *  Simulate moving object position.
     *  @param {Orientation} orientation - The orientation to move
     *  @param {number} distance - The distance
     *  @param {number} angle - The angle
     *  @returns {Vector3}
     */
    getFuturPosition(orientation: Orientation, distance: number, angle: number): 
        Vector3
    {
        let position = new Vector3(this.previousPosition.x, this
            .previousPosition.y, this.previousPosition.z);

        // The speed depends on the time elapsed since the last update
        let w = Scene.Map.current.mapProperties.length * Datas.Systems
            .SQUARE_SIZE;
        let h = Scene.Map.current.mapProperties.width * Datas.Systems
            .SQUARE_SIZE;
        let xPlus: number, zPlus: number, res: number;
        if (orientation === Orientation.South || this.previousOrientation ===
            Orientation.South)
        {
            xPlus = distance * Mathf.cos(angle * Math.PI / 180.0);
            zPlus = distance * Mathf.sin(angle * Math.PI / 180.0);
            res = position.z - zPlus;
            if (res >= 0 && res < h) {
                position.setZ(res);
            }
            res = position.x - xPlus;
            if (res >= 0 && res < w) {
                position.setX(res);
            }
        }
        if (orientation === Orientation.West || this.previousOrientation ===
            Orientation.West)
        {
            xPlus = distance * Mathf.cos((angle - 90.0) * Math.PI / 180.0);
            zPlus = distance * Mathf.sin((angle - 90.0) * Math.PI / 180.0);
            res = position.x + xPlus;
            if (res >= 0 && res < w)  {
                position.setX(res);
            }
            res = position.z + zPlus;
            if (res >= 0 && res < h) {
               position.setZ(res);
            }
        }
        if (orientation === Orientation.North || this.previousOrientation ===
            Orientation.North)
        {
            xPlus = distance * Mathf.cos(angle * Math.PI / 180.0);
            zPlus = distance * Mathf.sin(angle * Math.PI / 180.0);
            res = position.z + zPlus;
            if (res >= 0 && res < h) {
                position.setZ(res);
            }
            res = position.x + xPlus;
            if (res >= 0 && res < w) {
                position.setX(res);
            }
        }
        if (orientation === Orientation.East || this.previousOrientation ===
            Orientation.East)
        {
            xPlus = distance * Mathf.cos((angle - 90.0) * Math.PI / 180.0);
            zPlus = distance * Mathf.sin((angle - 90.0) * Math.PI / 180.0);
            res = position.x - xPlus;
            if (res >= 0 && res < w) {
                position.setX(res);
            }
            res = position.z - zPlus;
            if (res >= 0 && res < h) {
                position.setZ(res);
            }
        }

        // Collision
        this.updateBBPosition(position);
        let yMountain = null;
        let blocked = false;
        let i: number, l: number, result: [boolean, number];
        for (i = 0, l = this.meshBoundingBox.length; i < l; i++) {
            this.currentBoundingBox = this.meshBoundingBox[i];
            result = Manager.Collisions.checkRay(this.position, 
                position, this);
            if (result[0]) {
                blocked = true;
                position = this.position;
                break;
            }
            if (result[1] !== null) {
                yMountain = result[1];
            }
        }
        /* If not blocked and possible Y up/down, check if there is no collision
        on top */
        if (!blocked && yMountain !== null) {
            position.setY(yMountain);
            for (i = 0, l = this.meshBoundingBox.length; i < l; i++) {
                this.currentBoundingBox = this.meshBoundingBox[i];
                result = Manager.Collisions.checkRay(this.position, 
                    position, this);
                if (result[0]) {
                    position = this.position;
                    break;
                }
            }
        }
        this.updateBBPosition(this.position);
        return position;
    }

    /** 
     *  Check collision with another object.
     *  @param {MapObject} object - The other map object
     *  @returns {boolean}
    */
    checkCollisionObject(object: MapObject): boolean {
        let i: number, j: number, l: number, m: number;
        for (i = 0, l = this.meshBoundingBox.length; i < l; i++) {
            for (j = 0, m = object.meshBoundingBox.length; j < m; j++) {
                if (Manager.Collisions.obbVSobb(<CustomGeometry>this
                    .meshBoundingBox[i].geometry, <CustomGeometry>object
                    .meshBoundingBox[j].geometry))
                {
                    return true;
                }
            }
        }
        return false;
    }

    /** 
     *  Check the collision detection.
     *  @returns {Vector3}
     */
    checkCollisionDetection(): boolean {
        let i: number, l: number;
        for (i = 0, l = this.meshBoundingBox.length; i < l; i++) {
            if (Manager.Collisions.obbVSobb(<CustomGeometry>this.meshBoundingBox
                [i].geometry, <CustomGeometry>Manager.Collisions
                .BB_BOX_DETECTION.geometry))
            {
                return true;
            }
        }
        // If no bounding box, use only one square by default
        if (l === 0) {
            Manager.Collisions.applyBoxSpriteTransforms(Manager.Collisions
                .BB_BOX_DEFAULT_DETECTION, [this.position.x, this.position.y + 
                (Datas.Systems.SQUARE_SIZE / 4), this.position.z, Datas.Systems
                .SQUARE_SIZE / 2, Datas.Systems.SQUARE_SIZE / 2, Datas.Systems
                .SQUARE_SIZE / 2, 0, 0, 0]);
            if (Manager.Collisions.obbVSobb(<CustomGeometry>Manager.Collisions
                .BB_BOX_DEFAULT_DETECTION.geometry, <CustomGeometry>Manager
                .Collisions.BB_BOX_DETECTION.geometry))
            {
                return true;
            }
        }
        return false;
    }

    /** 
     *  Only updates the bounding box mesh position.
     *  @param {Vector3} position - Position to update
     */
    updateBB(position: Vector3) {
        if (this.currentStateInstance.graphicKind !== ElementMapKind.Object3D && 
            this.currentStateInstance.graphicID !== 0) {
            this.boundingBoxSettings.squares = Scene.Map.current
                .collisions[PictureKind.Characters][this.currentStateInstance
                .graphicID][this.getStateIndex()];
        }
        this.removeBBFromScene();
        // If state option through, ignore BB
        if (this.currentStateInstance.through) {
            return;
        }
        let box: THREE.Mesh;
        switch (this.currentStateInstance.graphicKind) {
            case ElementMapKind.SpritesFix:
            case ElementMapKind.SpritesFace:
            {
                this.boundingBoxSettings.b = new Array;
                for (let i = 0, l = this.boundingBoxSettings.squares.length; i < l; i++) {
                    this.boundingBoxSettings.b.push(CollisionSquare.getBB(this
                        .boundingBoxSettings.squares[i], this.width, this.height));
                    if (this.currentStateInstance.graphicKind === ElementMapKind.SpritesFix) {
                        box = Manager.Collisions.createBox();
                        Manager.Collisions.applyBoxSpriteTransforms(box, 
                            [
                                position.x + this.boundingBoxSettings.b[i][0],
                                position.y + this.boundingBoxSettings.b[i][1],
                                position.z + this.boundingBoxSettings.b[i][2],
                                this.boundingBoxSettings.b[i][3],
                                this.boundingBoxSettings.b[i][4],
                                this.boundingBoxSettings.b[i][5],
                                this.boundingBoxSettings.b[i][6],
                                this.boundingBoxSettings.b[i][7],
                                this.boundingBoxSettings.b[i][8]
                            ]
                        );
                    } else {
                        box = Manager.Collisions.createOrientedBox();
                        Manager.Collisions.applyOrientedBoxTransforms(box, 
                            [
                                position.x + this.boundingBoxSettings.b[i][0],
                                position.y + this.boundingBoxSettings.b[i][1],
                                position.z + this.boundingBoxSettings.b[i][2],
                                this.boundingBoxSettings.b[i][3],
                                this.boundingBoxSettings.b[i][4],
                            ]
                        );
                    }
                    this.meshBoundingBox.push(box);
                }
                break;
            }
            case ElementMapKind.Object3D:
                box = Manager.Collisions.createBox();
                Manager.Collisions.applyBoxSpriteTransforms(box, 
                    [
                        position.x + this.boundingBoxSettings.b[0][0],
                        position.y + this.boundingBoxSettings.b[0][1],
                        position.z + this.boundingBoxSettings.b[0][2],
                        this.boundingBoxSettings.b[0][3],
                        this.boundingBoxSettings.b[0][4],
                        this.boundingBoxSettings.b[0][5],
                        this.boundingBoxSettings.b[0][6],
                        this.boundingBoxSettings.b[0][7],
                        this.boundingBoxSettings.b[0][8]
                    ]
                );
                this.meshBoundingBox.push(box);
                break;
        }
        this.addBBToScene();
    }

    /** 
     *  Only updates the bounding box mesh position.
     *  @param {Vector3} position - Position to update
     */
    updateBBPosition(position: Vector3) {
        for (let i = 0, l = this.meshBoundingBox.length; i < l; i++) {
            if (this.currentStateInstance.graphicKind === ElementMapKind.SpritesFix || 
                this.currentStateInstance.graphicKind === ElementMapKind.Object3D) {
                Manager.Collisions.applyBoxSpriteTransforms(this.meshBoundingBox
                    [i],
                    [
                        position.x + this.boundingBoxSettings.b[i][0],
                        position.y + this.boundingBoxSettings.b[i][1],
                        position.z + this.boundingBoxSettings.b[i][2],
                        this.boundingBoxSettings.b[i][3],
                        this.boundingBoxSettings.b[i][4],
                        this.boundingBoxSettings.b[i][5],
                        this.boundingBoxSettings.b[i][6],
                        this.boundingBoxSettings.b[i][7],
                        this.boundingBoxSettings.b[i][8]
                    ]
                );
            } else if (this.currentStateInstance.graphicKind === ElementMapKind.SpritesFace) {
                Manager.Collisions.applyOrientedBoxTransforms(this
                    .meshBoundingBox[i],
                    [
                        position.x + this.boundingBoxSettings.b[i][0],
                        position.y + this.boundingBoxSettings.b[i][1],
                        position.z + this.boundingBoxSettings.b[i][2],
                        this.boundingBoxSettings.b[i][3],
                        this.boundingBoxSettings.b[i][4]
                    ]
                );
            }
        }
    }

    /** 
     *  Move the object (one step).
     *  @param {Orientation} orientation - Orientation to move
     *  @param {number} limit - Max distance to go
     *  @param {number} angle - The angle
     *  @param {boolean} isCameraOrientation - Indicate if this should take 
     *  account of camera orientation
     *  @returns {number[]}
    */
    move(orientation: Orientation, limit: number, angle: number, 
        isCameraOrientation: boolean): number[]
    {
        if (this.removed) {
            return [0, 0];
        }
        
        // Remove from move
        this.removeMoveTemp();

        // Set position
        let speed = this.speed.getValue() * MapObject.SPEED_NORMAL * Manager
            .Stack.averageElapsedTime * Datas.Systems.SQUARE_SIZE;
        if (this.otherMoveCommand !== null) {
            speed *= Math.SQRT1_2;
        }
        let normalDistance = Math.min(limit, speed);
        let position = this.getFuturPosition(orientation, normalDistance, angle);
        let distance = (position.equals(this.position)) ? 0 : normalDistance;
        if (this.previousOrientation !== null) {
            orientation = this.previousOrientation;
        }
        if (isCameraOrientation) {
            orientation = Mathf.mod(orientation + Scene.Map.current
                .camera.getMapOrientation() - 2, 4);
        }
        this.position.set(position.x, position.y, position.z);

        // Update orientation
        if (this.currentStateInstance && !this.currentStateInstance.directionFix) {
            this.orientationEye = orientation;
            orientation = this.orientation;
            if (this.currentStateInstance && this.currentStateInstance.setWithCamera) {
                this.updateOrientation();
            }
            if (this.orientation !== orientation) {
                this.updateUVs();
            }
        }

        this.moving = true;

        // Add to moving objects
        this.addMoveTemp();

        // Add to game steps infos
        if (this.isHero && distance > 0) {
            Game.current.steps++;
        }

        // Update terrrain
        this.updateTerrain();

        return [distance, normalDistance];
    }

    /** 
     *  Teleport the object.
     *  @param {Vector3} position - Position to teleport
     */
    teleport(position: Vector3) {
        if (this.removed) {
            return;
        }

        // Remove from move
        this.removeMoveTemp();

        // Set position
        this.position.set(position.x, position.y, position.z);
        this.updateBBPosition(position);
        this.moving = true;

        // Add to moving objects
        this.addMoveTemp();
    }

    /** 
     *  Jump the object (one step).
     *  @param {Vector3} start - The start position of the jump
     *  @param {Vector3} end - The end position of the jump
     *  @param {number} peak - The y peak
     *  @param {number} currentTime - The current time for jump animation
     *  @param {number} finalTime - The total final time for complete jump animation
     *  @returns {number}
     */
    jump(start: Vector3, end: Vector3, peak: number, currentTime: number, 
        finalTime: number): number {
        if (this.removed) {
            return finalTime;
        }
        
        // Remove from move
        this.removeMoveTemp();

        // Set position
        let a = -(peak - start.y) / ((finalTime / 2) * (finalTime / 2));
        let coef = 1;
        if (start.y !== end.y) {
            let tEnd = Math.sqrt((end.y - peak) / a);
            let reduce = (finalTime / 2) - tEnd;
            coef = (finalTime - reduce) / finalTime;
        }
        currentTime = Math.min(currentTime + Manager.Stack.elapsedTime, finalTime);
        let t = (currentTime * coef) - (finalTime / 2);
        let y = (a * (t * t)) + peak;
        let x = (currentTime / finalTime) * (end.x - start.x) + start.x;
        let z = (currentTime / finalTime) * (end.z - start.z) + start.z;
        this.position.set(x, y, z);
        this.updateBBPosition(this.position);

        // Update orientation
        if (this.currentStateInstance && !this.currentStateInstance.directionFix) {
            let orientation = this.orientationEye;
            x = end.x - start.x;
            z = end.z - start.z;
            if (x !== 0) {
                orientation = x > 0 ? Enum.Orientation.East : Enum.Orientation.West;
            } else if (z !== 0) {
                orientation = z > 0 ? Enum.Orientation.South : Enum.Orientation.North;
            }
            this.orientationEye = orientation;
            orientation = this.orientation;
            if (this.currentStateInstance && this.currentStateInstance.setWithCamera) {
                this.updateOrientation();
            }
            if (this.orientation !== orientation) {
                this.updateUVs();
            }
        }

        // Add to moving objects
        this.addMoveTemp();

        // Update terrrain
        this.updateTerrain();

        return currentTime;
    }

    /** 
     *  Look a direction.
     *  @param {Vector3} orientation - The direction to look at.
     */
    lookAt(oriention: Orientation) {
        if (this.removed) {
            return;
        }
        this.orientationEye = oriention;
        oriention = this.orientation;
        if (this.currentStateInstance && this.currentStateInstance.setWithCamera) {
            this.updateOrientation();
        }
        if (this.orientation !== oriention) {
            this.updateUVs();
        }
    }

    /** 
     *  Remove datas move temp
     */
    removeMoveTemp() {
        if (!this.isHero)
        {
            let previousPortion = Position.createFromVector3(this.position)
                .getGlobalPortion();
            let objects = Game.current.getPortionDatas(Scene.Map.current.id, 
                previousPortion);

            // Remove from the moved objects in or out of the portion
            let movedObjects = objects.mout;
            let index: number;
            if (movedObjects) {
                index = movedObjects.indexOf(this);
                if (index !== -1) {
                    movedObjects.splice(index, 1);
                }
            }
            movedObjects = objects.min;
            if (movedObjects) {
                index = movedObjects.indexOf(this);
                if (index !== -1) {
                    movedObjects.splice(index, 1);
                }
            }
            // Add to moved objects of the original portion if not done yet
            let originalPortion = Scene.Map.current.allObjects[this
                .system.id].getGlobalPortion();
            objects = Game.current.getPortionDatas(Scene.Map.current.id, 
                originalPortion);
            movedObjects = objects.m;
            if (movedObjects && movedObjects.indexOf(this) === -1) {
                movedObjects.push(this);
                movedObjects = Scene.Map.current.getMapPortion(Scene.Map.current
                    .getLocalPortion(originalPortion)).objectsList;
                index = movedObjects.indexOf(this);
                if (index !== -1) {
                    movedObjects.splice(index, 1);
                }
            }
        }
    }

    /** 
     *  Add to datas move temp
     */
    addMoveTemp() {
        if (!this.isHero) {
            let afterPortion = Position.createFromVector3(this.position)
                .getGlobalPortion();
            let objects = Game.current.getPortionDatas(Scene.Map.current.id, 
                afterPortion);
            let originalPortion = Scene.Map.current.allObjects[this
                .system.id].getGlobalPortion();
            if (!originalPortion.equals(afterPortion)) {
                objects.mout.push(this);
            } else {
                objects.min.push(this);   
            }

            // Add or remove from scene
            if (Scene.Map.current.isInPortion(Scene.Map.current
                .getLocalPortion(afterPortion)))
            {
                this.addToScene();
            } else {
                this.removeFromScene();
            }
        }
    }

    /** 
     *  Add object mesh to scene
     */
    addToScene() {
        if (!this.isInScene && this.mesh !== null) {
            Scene.Map.current.scene.add(this.mesh);
            this.isInScene = true;
        }
    }

    /** 
     *  Add bounding boxes mesh to scene
     */
    addBBToScene() {
        if (Datas.Systems.showBB) {
            for (let i = 0, l = this.meshBoundingBox.length; i < l; i++) {
                Scene.Map.current.scene.add(this.meshBoundingBox[i]);
            }
        }
    }

    /** 
     *  remove object mesh from scene
     */
    removeFromScene() {
        if (this.isInScene) {
            Scene.Map.current.scene.remove(this.mesh);
            this.removeBBFromScene();
            this.isInScene = false;
        }
    }

    /** 
     *  Remove bounding boxes mesh from scene
     */
    removeBBFromScene() {
        if (Datas.Systems.showBB) {
            for (let i = 0, l = this.meshBoundingBox.length; i < l; i++) {
                Scene.Map.current.scene.remove(this.meshBoundingBox[i]);
            }
        }
        this.meshBoundingBox = new Array;
    }

    /** 
     *  Receive an event.
     *  @param {MapObject} sender - The sender of this event
     *  @param {boolean} isSystem - Indicate if it is an event System
     *  @param {number} eventID - The event ID
     *  @param {Parameter[]} parameters - List of all the parameters
     *  @param {number[]} states - List of all the current states of the object
     *  @param {number[]} events - The time events list
     *  @returns {boolean}
    */
    receiveEvent(sender: MapObject, isSystem: boolean, eventID: number, 
        parameters: System.DynamicValue[], states: number[], events?: [System
        .Event, number]): boolean
    {
        // Option only one event per frame
        if ((this.system.isEventFrame && this.receivedOneEvent || this.removed)) {
            return false;
        }

        // Option can be triggered be another object
        if (!this.system.canBeTriggeredAnotherObject) {
            for (let interpreter of Manager.Stack.top.reactionInterpreters) {
                if (interpreter.currentMapObject !== this && interpreter
                    .currentMapObject != sender) {
                    return false;
                }
            }
            for (let interpreter of Manager.Stack.top.parallelCommands) {
                if (interpreter.currentMapObject !== this && interpreter
                    .currentMapObject != sender) {
                    return false;
                }
            }
        }

        let test = false;
        let i: number, j: number, l: number, m: number, state: number, reactions
            : System.Reaction[];
        for (i = 0, l = states.length; i < l; i++) {
            state = states[i];
            reactions = this.system.getReactions(isSystem, eventID, states[i], 
                parameters);
            for (j = 0, m = reactions.length; j < m; j++) {
                Manager.Stack.top.addReaction(sender, reactions[j], this, state,
                    parameters, events);
                // If sender is in this map and no fix, look at the object
                if (sender && sender.position && sender !== this && !this
                    .currentStateInstance.directionFix) {
                    this.orientationEye = this.getOrientationBetween(sender);
                }
                this.receivedOneEvent = true;
                test = true;
                if (this.system.isEventFrame) {
                    return true;
                }
            }
        }
        return test;
    }

    /** 
     *  Update according to camera angle.
     *  @param {number} angle - The camera angle
     */
    update(angle: number = 0) {
        if (this.removed) {
            return;
        }
        if (this.moveFrequencyTick > 0)
        {
            this.moveFrequencyTick -= Manager.Stack.elapsedTime;
        }

        // Graphic updates
        if (this.mesh !== null) {
            let frame = false;
            let orientation = this.orientation;
            if (this.moving) {
                // If moving, update frame
                if (this.currentStateInstance.moveAnimation) {
                    frame = this.frame.update(Datas.Systems.mapFrameDuration
                        .getValue() / this.speed.getValue());
                }

                // Update mesh position
                let offset = (this.currentStateInstance.pixelOffset && this
                    .frame.value % 2 !== 0) ? 1 : 0;
                this.mesh.position.set(this.position.x, this.position.y + offset
                    , this.position.z);
                //this.updateBBPosition(this.position)
            } else {
                if (this.currentStateInstance.stopAnimation) {
                    frame = this.frame.update(Datas.Systems.mapFrameDuration
                        .getValue() / this.speed.getValue());
                } else {
                    frame = this.frame.value !== this.currentStateInstance.indexX;
                    this.frame.value = this.currentStateInstance.indexX;
                }
                // Update mesh position
                let offset = (this.currentStateInstance.pixelOffset && this
                    .frame.value % 2 !== 0) ? 1 : 0;
                this.mesh.position.set(this.position.x, this.position.y + offset
                    , this.position.z);

                // Update angle
                if (this.currentStateInstance && this.currentStateInstance.setWithCamera) {
                    this.updateOrientation();
                }
            }
            this.updateAngle(angle);

            // Update mesh
            if (frame || orientation !== this.orientation) {
                this.updateUVs();
            }
        }

        // Moving
        this.updateMovingState();

        // Time events
        this.receivedOneEvent = false;
        this.updateTimeEvents();

        // Positions
        if (this.position) {
            this.previousPosition = this.position;
            this.upPosition = new Vector3(this.position.x, this.position.y 
                + (this.height * Datas.Systems.SQUARE_SIZE), this.position.z);
            this.halfPosition = new Vector3(this.position.x, this.position
                .y + (this.height * Datas.Systems.SQUARE_SIZE / 2), this
                .position.z);
        }
        this.moving = false;
    }

    /** 
     *  Update moving state.
     */
    updateMovingState() {
        if (!this.removed && this.currentState && this.currentState
            .objectMovingKind !== ObjectMovingKind.Fix)
        {
            let interpreter = Scene.Map.current.addReaction(null, this
                .currentState.route, this, this.currentState.id, [null], null, 
                true);
            if (interpreter !== null) {
                this.movingState = interpreter.currentCommandState;
            }
        }
    }

    /** 
     *  Update sprite faces angles.
     *  @param {number} angle - The camera angle
     */
    updateAngle(angle: number) {
        if (this.currentStateInstance.graphicKind === ElementMapKind.SpritesFace) {
            this.mesh.rotation.y = angle;
        }
    }

    /** 
     *  Update the orientation according to the camera position
     */
    updateOrientation() {
        this.orientation = Mathf.mod((Scene.Map.current.orientation - 2) 
            * 3 + this.orientationEye, 4);
    }

    /** 
     *  Update the UVs coordinates according to frame and orientation
     */
    updateUVs() {
        if (this.mesh !== null && !this.isNone() && this.currentStateInstance
            .graphicKind !== ElementMapKind.Object3D) {
            let texture = Manager.GL.getMaterialTexture(<THREE.ShaderMaterial>
                this.mesh.material);
            if (texture) {
                let textureWidth = texture.image.width;
                let textureHeight = texture.image.height;
                let w: number, h: number, x: number, y: number;
                if (this.currentStateInstance.graphicID === 0) {
                    w = this.width * Datas.Systems.SQUARE_SIZE / textureWidth;
                    h = this.height * Datas.Systems.SQUARE_SIZE / textureHeight;
                    x = this.currentStateInstance.rectTileset[0] * Datas.Systems
                        .SQUARE_SIZE / textureWidth;
                    y = this.currentStateInstance.rectTileset[1] * Datas.Systems
                        .SQUARE_SIZE / textureHeight;
                } else {
                    w = this.width * Datas.Systems.SQUARE_SIZE / textureWidth;
                    h = this.height * Datas.Systems.SQUARE_SIZE / textureHeight;
                    x = (this.frame.value >= Datas.Systems.FRAMES ? Datas
                        .Systems.FRAMES - 1 : this.frame.value) * w;
                    y = (this.orientation + (this.currentOrientationStop || (
                        this.currentStateInstance.stopAnimation && !this.moving) 
                        ? 4 : 0)) * h;
                }
                let coefX = MapElement.COEF_TEX / textureWidth;
                let coefY = MapElement.COEF_TEX / textureHeight;
                x += coefX;
                y += coefY;
                w -= (coefX * 2);
                h -= (coefY * 2);
                let texA = new Vector2();
                let texB = new Vector2();
                let texC = new Vector2();
                let texD = new Vector2();
                CustomGeometry.uvsQuadToTex(texA, texB, texC, texD, x, y, w, h);

                // Update geometry
                (<CustomGeometry>this.mesh.geometry).pushQuadUVs(texA, texB, 
                    texC, texD);
                (<CustomGeometry>this.mesh.geometry).updateUVs();
            }
        }
    }

    /** 
     *  Update the material
     */
    updateMaterial() {
        if (!this.isNone()) {
            this.mesh.material = this.currentStateInstance.graphicID === 0 ?
                Scene.Map.current.textureTileset : Scene.Map.current
                .texturesCharacters[this.currentStateInstance.graphicID];
        } else {
            this.mesh = null;
        }
    }

    /** 
     *  Get the state index.
     *  @returns {number}
     */
    getStateIndex(): number {
        return this.frame.value + (this.orientation * Datas.Systems.FRAMES);
    }

    /** 
     *  Check if graphics is none.
     *  @returns {boolean}
     */
    isNone(): boolean {
        return this.currentStateInstance.graphicKind === ElementMapKind.None || this
            .currentStateInstance.graphicID === -1;
    }

    /** 
     *  Get the orientation between two objects.
     *  @param {Core.MapObject} object
     *  @returns {Enum.Orientation}
     */
    getOrientationBetween(object: MapObject): Enum.Orientation {
        let x = Math.abs(object.position.x - this.position.x);
        let z = Math.abs(object.position.z - this.position.z);
        let orientation = this.orientationEye;
        if (x >= z) {
            if (object.position.x >= this.position.x) {
                orientation = Enum.Orientation.East;
            } else if (object.position.x < this.position.x) {
                orientation = Enum.Orientation.West;
            }
        } else {
            if (object.position.z >= this.position.z) {
                orientation = Enum.Orientation.South;
            } else if (object.position.z < this.position.z) {
                orientation = Enum.Orientation.North;
            }
        }
        return orientation;
    }

    /** 
     *  Update the terrain the object is currently on.
     */
    updateTerrain() {
        this.terrain = 0;
        if (this.position) {
            let mapPortion = Scene.Map.current.getMapPortion(Scene.Map.current
                .getLocalPortion(Portion.createFromVector3(this.position)));
            if (mapPortion) {
                let position = Position.createFromVector3(this.position);
                let collision = mapPortion.boundingBoxesLands[position.toIndex()][0];
                if (collision && collision.cs) {
                    this.terrain = collision.cs.terrain;
                }
            }
        }
    }
}

export { StructSearchResult, MapObject }