import {SceneObject} from "@xeokit/scene";
import {collapseAABB3, expandAABB3} from "@xeokit/math/boundaries";
import {SceneObjectsKdTree3D} from "./sceneObjectsKdTree3D";

/**
 * Indexes the given SceneObjects in a k-d tree for efficient collision detection.
 */
export function createSceneObjectsKdTree3D(sceneObjects: SceneObject[]): SceneObjectsKdTree3D {
    const aabb = collapseAABB3();
    for (let i = 0, len = sceneObjects.length; i < len; i++) {
        expandAABB3(aabb, sceneObjects[i].aabb);
    }
    const kdTree = new SceneObjectsKdTree3D({aabb});
    for (let i = 0, len = sceneObjects.length; i < len; i++) {
        const sceneObject = sceneObjects[i];
        kdTree.insertItem(sceneObject, sceneObject.aabb);
    }
    return kdTree;
}

