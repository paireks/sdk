
import {Mesh} from "./Mesh";
import {FloatArrayParam} from "@xeokit/math/math";
import {RendererObject} from "./RendererObject";

/**
 * Represents an object in a {@link @xeokit/scene!SceneModel}.
 *
 * * Stored in {@link @xeokit/scene!SceneModel.objects | SceneModel.objects} and {@link @xeokit/scene!Scene.objects | Scene.objects}
 * * Created with {@link @xeokit/scene!SceneModel.createObject | SceneModel.createObject}
 *
 * See usage in:
 *
 * * [@xeokit/scene](/docs/modules/_xeokit_scene.html)
 * * [@xeokit/viewer](/docs/modules/_xeokit_viewer.html)
 */
export class SceneObject  {

    /**
     * Unique ID of this SceneObject.
     */
    id: string;

    /**
     * The {@link Mesh | Meshes} belonging to this SceneObject.
     */
    meshes: Mesh[];

    /**
     *  Internal interface through which a {@link SceneObject} can load property updates into a renderer.
     *
     *  This is defined while the owner {@link SceneModel} has been added to a {@link @xeokit/viewer!Viewer | Viewer}.
     *
     * @internal
     */
    rendererObject?: RendererObject;

    constructor(cfg: {
        meshes: Mesh[];
        id: string;
    }) {
        this.id = cfg.id;
        this.meshes = cfg.meshes;
    }

    /**
     * Gets the axis-aligned 3D World-space boundary of this SceneObject.
     */
    get aabb(): FloatArrayParam {
        return undefined;
    }
}