/*
    RPG Paper Maker Copyright (C) 2017-2022 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

/** @class
 *  Datas structure of tree.
 *  @param {Node} parent - Parent of the node
 *  @param {any} data - Data of the node
 */
class Node {

    public data: any;
    public parent: Node;
    public firstChild: Node;
    public lastChild: Node;
    public next: Node;

    constructor(parent: Node, data: any) {
        this.data = data;
        this.parent = parent;
        this.firstChild = null;
        this.lastChild = null;
        this.next = null;
    }

    /**
     * Add a new child.
     * @param data
     */
    public add(data: any): Node {
        let node = new Node(this, data);
        if (this.firstChild === null) {
            this.firstChild = node;
        } else {
            this.lastChild.next = node;
        }
        this.lastChild = node;
        return node;
    }

    /** 
     *  Check if this node is the root of the tree.
     *  @returns {boolean}
     */
    public isRoot(): boolean {
        return this.parent === null;
    }

    /** 
     *  Get the next parent child
     *  @returns {Node}
     */
    public getNext(): Node {
        if (this.next === null) {
            return (this.parent.isRoot()) ? null : this.parent;
        }
        return this.next;
    }
}

export { Node }