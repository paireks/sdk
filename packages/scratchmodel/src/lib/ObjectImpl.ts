import {XKTObject} from "@xeokit/core/components";
import {MeshImpl} from "./MeshImpl";

/**
 * @private
 */
export class ObjectImpl implements XKTObject {

    id: string;

    meshes: MeshImpl[];

    constructor(cfg: {
        meshes: MeshImpl[];
        id: string;
    }) {
        this.id = cfg.id;
        this.meshes = cfg.meshes;
    }
}