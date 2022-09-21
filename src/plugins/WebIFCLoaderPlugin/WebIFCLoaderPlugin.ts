import * as WebIFC from "web-ifc/web-ifc-api/";

import * as utils from "../../viewer/utils"
import {Plugin} from "../../viewer/Plugin";
import {WebIFCDefaultDataSource} from "./WebIFCDefaultDataSource";
import {IFCObjectDefaults} from "../../viewer/metadata/IFCObjectDefaults";
import * as math from "../../viewer";
import {SceneModel, Viewer} from "../../viewer";
import {worldToRTCPositions} from "../../viewer/math/";

/**
 {@link Viewer} plugin that uses [web-ifc](https://github.com/tomvandig/web-ifc) to load BIM models directly from IFC files.

 <a href="https://xeokit.github.io/xeokit-webgpu-sdk/examples/#BIMOffline_WebIFCLoaderPlugin_Duplex"><img src="https://xeokit.io/img/docs/WebIFCLoaderPlugin/WebIFCLoaderPlugin.png"></a>

 [[Run this example](https://xeokit.github.io/xeokit-webgpu-sdk/examples/#BIMOffline_WebIFCLoaderPlugin_Duplex)]

 ## Overview

 * Loads small-to-medium sized BIM models directly from IFC files.
 * Uses [web-ifc](https://github.com/tomvandig/web-ifc) internally, to parse IFC files in the browser.
 * Loads IFC geometry, element structure metadata, and property sets.
 * Not for large models. For best performance with large models, we recommend using {@link XKTLoaderPlugin}.
 * Loads double-precision coordinates, enabling models to be viewed at global coordinates without accuracy loss.
 * Allows to set the position, scale and rotation of each model as you load it.
 * Filter which IFC types get loaded.
 * Configure initial appearances of specified IFC types.
 * Set a custom data source for IFC files.
 * Load multiple copies of the same model.

 ## Limitations

 Loading and parsing huge IFC STEP files can be slow, and can overwhelm the browser, however. To view your
 largest IFC models, we recommend instead pre-converting those to xeokit's compressed native .XKT format, then
 loading them with {@link XKTLoaderPlugin} instead.</p>

 ## Scene representation

 When loading a model, WebIFCLoaderPlugin creates an {@link Entity} that represents the model, which
 will have {@link Entity#isModel} set ````true```` and will be registered by {@link Entity#id}
 in {@link Scene#models}. The WebIFCLoaderPlugin also creates an {@link Entity} for each object within the
 model. Those Entities will have {@link Entity#isObject} set ````true```` and will be registered
 by {@link Entity#id} in {@link Scene#objects}.

 ## Metadata

 When loading a model, WebIFCLoaderPlugin also creates a {@link DataModel} that represents the model, which contains
 a {@link DataObject} for each IFC element, plus a {@link PropertySet} for each IFC property set. Loading metadata can be very slow, so we can also optionally disable it if we
 don't need it.

 ## Usage

 In the example below we'll load the Duplex BIM model from
 an [IFC file](https://github.com/xeokit/xeokit-webgpu-sdk/tree/master/assets/models/ifc). Within our {@link Viewer}, this will create a bunch of {@link Entity}s that represents the model and its objects, along with a {@link DataModel}, {@link DataObject}s and {@link PropertySet}s
 that hold their metadata.

 Since this model contains IFC types, the WebIFCLoaderPlugin will set the initial appearance of each object
 {@link Entity} according to its IFC type in {@link WebIFCLoaderPlugin#objectDefaults}.

 [[Run example](https://xeokit.github.io/xeokit-webgpu-sdk/examples/#BIMOffline_WebIFCLoaderPlugin_isolateStorey)]

 ````javascript
 import {Viewer, WebIFCLoaderPlugin} from "xeokit-webgpu-sdk.es.js";

 //------------------------------------------------------------------------------------------------------------------
 // 1. Create a Viewer,
 // 2. Arrange the camera
 //------------------------------------------------------------------------------------------------------------------

 // 1
 const viewer = new Viewer({
      canvasId: "myCanvas",
      transparent: true
 });

 // 2
 viewer.camera.eye = [-2.56, 8.38, 8.27];
 viewer.camera.look = [13.44, 3.31, -14.83];
 viewer.camera.up = [0.10, 0.98, -0.14];

 //------------------------------------------------------------------------------------------------------------------
 // 1. Create a WebIFCLoaderPlugin, configured with a path to the bundled third-party web-ifc.wasm module
 // 2. Load a BIM model fom an IFC file, excluding its IfcSpace elements, and highlighting edges
 //------------------------------------------------------------------------------------------------------------------

 // 1
 const ifcLoader = new WebIFCLoaderPlugin(viewer, {
     wasmPath: "../dist/" // <<------- Path to web-ifc.wasm, which does the IFC parsing for us
 });

 // 2
 const model = ifcLoader.load({          // Returns an Entity that represents the model
     id: "myModel",
     src: "../assets/models/ifc/Duplex.ifc",
     excludeTypes: ["IfcSpace"],
     edges: true
 });

 model.on("loaded", () => {

     //--------------------------------------------------------------------------------------------------------------
     // 1. Find metadata on the bottom storey
     // 2. X-ray all the objects except for the bottom storey
     // 3. Fit the bottom storey in view
     //--------------------------------------------------------------------------------------------------------------

     // 1
     const metaModel = viewer.sceneData.models["myModel"];       // DataModel with ID "myModel"
     const objectData
          = viewer.sceneData.objects["1xS3BCk291UvhgP2dvNsgp"];  // DataObject with ID "1xS3BCk291UvhgP2dvNsgp"

     const name = objectData.name;                                   // "01 eerste verdieping"
     const type = objectData.type;                                   // "IfcBuildingStorey"
     const parent = objectData.parent;                               // DataObject with type "IfcBuilding"
     const children = objectData.children;                           // Array of child ObjectDatas
     const objectId = objectData.id;                                 // "1xS3BCk291UvhgP2dvNsgp"
     const objectIds = viewer.sceneData.getObjectIDsInSubtree(objectId);   // IDs of leaf sub-objects
     const aabb = viewer.scene.getAABB(objectIds);                   // Axis-aligned boundary of the leaf sub-objects

     // 2
     viewer.scene.setObjectsXRayed(viewer.scene.objectIds, true);
     viewer.scene.setObjectsXRayed(objectIds, false);

     // 3
     viewer.cameraFlight.flyTo(aabb);
 });

 // Find the model Entity by ID
 model = viewer.scene.models["myModel"];

 // Destroy the model
 model.destroy();
 ````

 ## Transforming

 We have the option to rotate, scale and translate each  IFC model as we load it.

 This lets us load multiple models, or even multiple copies of the same model, and position them apart from each other.

 In the example below, we'll scale our model to half its size, rotate it 90 degrees about its local X-axis, then
 translate it 100 units along its X axis.

 ````javascript
 ifcLoader.load({
      src: "../assets/models/ifc/Duplex.ifc",
      rotation: [90,0,0],
      scale: [0.5, 0.5, 0.5],
      origin: [100, 0, 0]
 });
 ````

 ## Including and excluding IFC types

 We can also load only those objects that have the specified IFC types.

 In the example below, we'll load only the objects that represent walls.

 ````javascript
 const model2 = ifcLoader.load({
     id: "myModel2",
     src: "../assets/models/ifc/Duplex.ifc",
     includeTypes: ["IfcWallStandardCase"]
 });
 ````

 We can also load only those objects that **don't** have the specified IFC types.

 In the example below, we'll load only the objects that do not represent empty space.

 ````javascript
 const model3 = ifcLoader.load({
     id: "myModel3",
     src: "../assets/models/ifc/Duplex.ifc",
     excludeTypes: ["IfcSpace"]
 });
 ````

 ## Configuring initial IFC object appearances

 We can specify the custom initial appearance of loaded objects according to their IFC types.

 This is useful for things like:

 * setting the colors to our objects according to their IFC types,
 * automatically hiding ````IfcSpace```` objects, and
 * ensuring that ````IfcWindow```` objects are always transparent.
 <br>
 In the example below, we'll load a model, while configuring ````IfcSpace```` elements to be always initially invisible,
 and ````IfcWindow```` types to be always translucent blue.

 ````javascript
 const myObjectDefaults = {

      IfcSpace: {
          visible: false
      },
      IfcWindow: {
          colorize: [0.337255, 0.303922, 0.870588], // Blue
          opacity: 0.3
      },

      //...

      DEFAULT: {
          colorize: [0.5, 0.5, 0.5]
      }
 };

 const model4 = ifcLoader.load({
      id: "myModel4",
      src: "../assets/models/ifc/Duplex.ifc",
      objectDefaults: myObjectDefaults // Use our custom initial default states for object Entities
 });
 ````

 When we don't customize the appearance of IFC types, as just above, then IfcSpace elements tend to obscure other
 elements, which can be confusing.

 It's often helpful to make IfcSpaces transparent and unpickable, like this:

 ````javascript
 const ifcLoader = new WebIFCLoaderPlugin(viewer, {
    wasmPath: "../dist/",
    objectDefaults: {
        IfcSpace: {
            pickable: false,
            opacity: 0.2
        }
    }
 });
 ````

 Alternatively, we could just make IfcSpaces invisible, which also makes them unpickable:

 ````javascript
 const ifcLoader = new WebIFCLoaderPlugin(viewer, {
    wasmPath: "../dist/",
    objectDefaults: {
        IfcSpace: {
            visible: false
        }
    }
 });
 ````

 ## Configuring a custom data source

 By default, WebIFCLoaderPlugin will load IFC files over HTTP.

 In the example below, we'll customize the way WebIFCLoaderPlugin loads the files by configuring it with our own data source
 object. For simplicity, our custom data source example also uses HTTP, using a couple of xeokit utility functions.

 ````javascript
 import * as utils from "xeokit-webgpu-sdk.es.js";

 class MyDataSource {

      constructor() {
      }

      // Gets the contents of the given IFC file in an arraybuffer
      getIFC(src, ok, error) {
          console.log("MyDataSource#getIFC(" + IFCSrc + ", ... )");
          utils.loadArraybuffer(src,
              (arraybuffer) => {
                  ok(arraybuffer);
              },
              function (errMsg) {
                  error(errMsg);
              });
      }
 }

 const ifcLoader2 = new WebIFCLoaderPlugin(viewer, {
       dataSource: new MyDataSource()
 });

 const model5 = ifcLoader2.load({
      id: "myModel5",
      src: "../assets/models/ifc/Duplex.ifc"
 });
 ````

 ## Loading multiple copies of a model, without object ID clashes

 Sometimes we need to load two or more instances of the same model, without having clashes
 between the IDs of the equivalent objects in the model instances.

 As shown in the example below, we do this by setting {@link WebIFCLoaderPlugin#globalizeObjectIds} ````true```` before we load our models.

 ````javascript
 ifcLoader.globalizeObjectIds = true;

 const model = ifcLoader.load({
      id: "model1",
      src: "../assets/models/ifc/Duplex.ifc"
 });

 const model2 = ifcLoader.load({
    id: "model2",
    src: "../assets/models/ifc/Duplex.ifc"
 });
 ````

 For each {@link Entity} loaded by these two calls, {@link Entity#id} and {@link DataObject#id} will get prefixed by
 the ID of their model, in order to avoid ID clashes between the two models.

 An Entity belonging to the first model will get an ID like this:

 ````
 myModel1#0BTBFw6f90Nfh9rP1dlXrb
 ````

 The equivalent Entity in the second model will get an ID like this:

 ````
 myModel2#0BTBFw6f90Nfh9rP1dlXrb
 ````

 Now, to update the visibility of both of those Entities collectively, using {@link Scene#setObjectsVisible}, we can
 supply just the IFC product ID part to that method:

 ````javascript
 myViewer.scene.setObjectVisibilities("0BTBFw6f90Nfh9rP1dlXrb", true);
 ````

 The method, along with {@link Scene#setObjectsXRayed}, {@link Scene#setObjectsHighlighted} etc, will internally expand
 the given ID to refer to the instances of that Entity in both models.

 We can also, of course, reference each Entity directly, using its globalized ID:

 ````javascript
 myViewer.scene.setObjectVisibilities("myModel1#0BTBFw6f90Nfh9rP1dlXrb", true);
 ````

 @class WebIFCLoaderPlugin
 @since 2.0.13
 */
export class WebIFCLoaderPlugin extends Plugin {

    #ifcAPI: WebIFC.IfcAPI;

    #dataSource: any;

    #objectDefaults?: { [key: string]: any };

    #includeTypes?: string[];

    #excludeTypes?: string[];

    #excludeUnclassifiedObjects?: boolean;

    #globalizeObjectIds?: boolean;

    /**
     * @constructor
     *
     * @param {Viewer} viewer The Viewer.
     * @param {Object} cfg  Plugin configuration.
     * @param {String} [cfg.id="ifcLoader"] Optional ID for this plugin, so that we can find it within {@link Viewer#plugins}.
     * @param {String} cfg.wasmPath Path to ````web-ifc.wasm````, required by WebIFCLoaderPlugin.
     * @param {Object} [cfg.objectDefaults] Map of initial default states for each loaded {@link Entity} that represents an object.  Default value is {@link IFCObjectDefaults}.
     * @param {Object} [cfg.dataSource] A custom data source through which the WebIFCLoaderPlugin can load model and metadata files. Defaults to an instance of {@link WebIFCDefaultDataSource}, which loads over HTTP.
     * @param {String[]} [cfg.includeTypes] When loading metadata, only loads objects that have {@link DataObject}s with {@link DataObject#type} values in this list.
     * @param {String[]} [cfg.excludeTypes] When loading metadata, never loads objects that have {@link DataObject}s with {@link DataObject#type} values in this list.
     * @param {Boolean} [cfg.excludeUnclassifiedObjects=false] When loading metadata and this is ````true````, will only load {@link Entity}s that have {@link DataObject}s (that are not excluded). This is useful when we don't want Entitys in the Scene that are not represented within IFC navigation components, such as {@link TreeViewPlugin}.
     */
    constructor(viewer: Viewer, cfg: {
        globalizeObjectIds: boolean;
        includeTypes?: string[];
        excludeTypes?: string[];
        excludeUnclassifiedObjects?: boolean;
        objectDefaults?: { [key: string]: any };
        wasmPath: string,
        dataSource?: any
    }) {

        super("ifcLoader", viewer, cfg);

        this.#dataSource = cfg.dataSource;
        this.#objectDefaults = cfg.objectDefaults;
        this.#includeTypes = cfg.includeTypes;
        this.#excludeTypes = cfg.excludeTypes;
        this.#excludeUnclassifiedObjects = cfg.excludeUnclassifiedObjects;
        this.#globalizeObjectIds = cfg.globalizeObjectIds;

        this.#ifcAPI = new WebIFC.IfcAPI();

        if (cfg.wasmPath) {
            this.#ifcAPI.SetWasmPath(cfg.wasmPath);
        }

        this.#ifcAPI.Init().then(() => {
            this.events.fire("initialized", true, false); // Don't forget the event
        }).catch((e: any) => {
            this.error(e);
        })
    }

    /**
     Gets the ````IFC```` format versions supported by this WebIFCLoaderPlugin.
     */
    get supportedVersions(): string[] {
        return ["2x3", "4"];
    }

    /**
     Gets the custom data source through which the WebIFCLoaderPlugin can load IFC files.

     Default value is {@link WebIFCDefaultDataSource}, which loads via HTTP.
     */
    get dataSource(): any {
        return this.#dataSource;
    }

    /**
     Sets a custom data source through which the WebIFCLoaderPlugin can load IFC files.

     Default value is {@link WebIFCDefaultDataSource}, which loads via HTTP.
     */
    set dataSource(value: any) {
        this.#dataSource = value || new WebIFCDefaultDataSource();
    }

    /**
     Gets map of initial default states for each loaded object.

     Default value is {@link IFCObjectDefaults}.
     */
    get objectDefaults(): { [key: string]: any } {
        return this.#objectDefaults;
    }

    /**
     Sets map of initial default states for each loaded {@link Entity} that represents an object.

     Default value is {@link IFCObjectDefaults}.
     */
    set objectDefaults(value: { [key: string]: any } | undefined) {
        this.#objectDefaults = value || IFCObjectDefaults;
    }

    /**
     Gets the whitelist of the IFC types loaded by this WebIFCLoaderPlugin.

     When loading IFC models, causes this WebIFCLoaderPlugin to only load objects whose types are in this
     list. An object's type is indicated by its {@link DataObject}'s {@link DataObject#type}.

     Default value is ````undefined````.
     */
    get includeTypes(): string[] | undefined {
        return this.#includeTypes;
    }

    /**
     Sets the whitelist of the IFC types loaded by this WebIFCLoaderPlugin.

     When loading IFC models, causes this WebIFCLoaderPlugin to only load objects whose types are in this
     list. An object's type is indicated by its {@link DataObject}'s {@link DataObject#type}.

     Default value is ````undefined````.
     */
    set includeTypes(value: string[] | undefined) {
        this.#includeTypes = value;
    }

    /**
     Gets the blacklist of IFC types that are never loaded by this WebIFCLoaderPlugin.

     When loading IFC models, causes this WebIFCLoaderPlugin to **not** load objects whose types are in this
     list. An object's type is indicated by its {@link DataObject}'s {@link DataObject#type}.

     Default value is ````undefined````.
     */
    get excludeTypes(): string[] | undefined {
        return this.#excludeTypes;
    }

    /**
     Sets the blacklist of IFC types that are never loaded by this WebIFCLoaderPlugin.

     When IFC models, causes this WebIFCLoaderPlugin to **not** load objects whose types are in this
     list. An object's type is indicated by its {@link DataObject}'s {@link DataObject#type}.

     Default value is ````undefined````.
     */
    set excludeTypes(value) {
        this.#excludeTypes = value;
    }

    /**
     Gets whether we load objects that don't have IFC types.

     When loading IFC models and this is ````true````, WebIFCLoaderPlugin will not load objects
     that don't have IFC types.

     Default value is ````false````.
     */
    get excludeUnclassifiedObjects(): boolean {
        return this.#excludeUnclassifiedObjects;
    }

    /**
     Sets whether we load objects that don't have IFC types.

     When loading IFC models and this is ````true````, WebIFCLoaderPlugin will not load objects
     that don't have IFC types.

     Default value is ````false````.
     */
    set excludeUnclassifiedObjects(value: boolean) {
        this.#excludeUnclassifiedObjects = value;
    }

    /**
     Gets whether WebIFCLoaderPlugin globalizes each {@link Entity#id} and {@link DataObject#id} as it loads a model.

     Default value is ````false````.
     */
    get globalizeObjectIds(): boolean {
        return this.#globalizeObjectIds;
    }

    /**
     Sets whether WebIFCLoaderPlugin globalizes each {@link Entity#id} and {@link DataObject#id} as it loads a model.

     Set  this ````true```` when you need to load multiple instances of the same model, to avoid ID clashes
     between the objects in the different instances.

     When we load a model with this set ````true````, then each {@link Entity#id} and {@link DataObject#id} will be
     prefixed by the ID of the model, ie. ````<modelId>#<objectId>````.

     {@link Entity#originalSystemId} and {@link DataObject#originalSystemId} will always hold the original, un-prefixed, ID values.

     Default value is ````false````.

     See the main {@link WebIFCLoaderPlugin} class documentation for usage info.
     */
    set globalizeObjectIds(value: boolean) {
        this.#globalizeObjectIds = !!value;
    }

    /**
     * Loads an ````IFC```` model into this WebIFCLoaderPlugin's {@link Viewer}.
     *
     * @param {*} params Loading parameters.
     * @param {String} [params.id] ID to assign to the root {@link Entity#id}, unique among all components in the Viewer's {@link Scene}, generated automatically by default.
     * @param {String} [params.src] Path to a IFC file, as an alternative to the ````ifc```` parameter.
     * @param {ArrayBuffer} [params.ifc] The IFC file data, as an alternative to the ````src```` parameter.
     * @param {Boolean} [params.loadMetadata=true] Whether to load IFC metadata (objects and property sets).
     * @param {{String:Object}} [params.objectDefaults] Map of initial default states for each loaded {@link Entity} that represents an object. Default value is {@link IFCObjectDefaults}.
     * @param {String[]} [params.includeTypes] When loading metadata, only loads objects that have {@link DataObject}s with {@link DataObject#type} values in this list.
     * @param {String[]} [params.excludeTypes] When loading metadata, never loads objects that have {@link DataObject}s with {@link DataObject#type} values in this list.
     * @param {Boolean} [params.edges=false] Whether or not xeokit renders the model with edges emphasized.
     * @param {Number[]} [params.origin=[0,0,0]] The model's World-space double-precision 3D origin. Use this to position the model within xeokit's World coordinate system, using double-precision coordinates.
     * @param {Number[]} [params.position=[0,0,0]] The model single-precision 3D position, relative to the ````origin```` parameter.
     * @param {Number[]} [params.scale=[1,1,1]] The model's scale.
     * @param {Number[]} [params.rotation=[0,0,0]] The model's orientation, given as Euler angles in degrees, for each of the X, Y and Z axis.
     * @param {Number[]} [params.matrix=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]] The model's world transform matrix. Overrides the position, scale and rotation parameters. Relative to ````origin````.
     * @param {Boolean} [params.edges=false] Indicates if the model's edges are initially emphasized.
     * @param {Boolean} [params.saoEnabled=true] Indicates if Scalable Ambient Obscurance (SAO) will apply to the model. SAO is configured by the Scene's {@link SAO} component. Only works when {@link SAO#enabled} is also ````true````
     * @param {Boolean} [params.pbrEnabled=false] Indicates if physically-based rendering (PBR) will apply to the model. Only works when {@link Scene#pbrEnabled} is also ````true````.
     * @param {Number} [params.backfaces=false] When we set this ````true````, then we force rendering of backfaces for the model. When we leave this ````false````, then we allow the Viewer to decide when to render backfaces. In that case, the Viewer will hide backfaces on watertight meshes, show backfaces on open meshes, and always show backfaces on meshes when we slice them open with {@link SectionPlane}s.
     * @param {Boolean} [params.excludeUnclassifiedObjects=false] When loading metadata and this is ````true````, will only load {@link Entity}s that have {@link DataObject}s (that are not excluded). This is useful when we don't want Entitys in the Scene that are not represented within IFC navigation components, such as {@link TreeViewPlugin}.
     * @param {Boolean} [params.globalizeObjectIds=false] Indicates whether to globalize each {@link Entity#id} and {@link DataObject#id}, in case you need to prevent ID clashes with other models. See {@link WebIFCLoaderPlugin#globalizeObjectIds} for more info.
     * @param {Object} [params.stats] Collects model statistics.
     * @returns {Entity} Entity representing the model, which will have {@link Entity#isModel} set ````true```` and will be registered by {@link Entity#id} in {@link Scene#models}.
     */
    load(params: {
        globalizeObjectIds?: boolean;
        excludeUnclassifiedObjects?: boolean;
        objectDefaults?: { [p: string]: any };
        includeTypes?: string[];
        excludeTypes?: string[];
        ifc?: ArrayBuffer;
        src?: string;
        loadMetadata?: boolean;
        id?: string
    } = {}) {

        if (params.id && this.viewer.scene.sceneModels[params.id]) {
            this.error("Component with this ID already exists in viewer: " + params.id + " - will autogenerate this ID");
            delete params.id;
        }

        const sceneModel = this.viewer.scene.createSceneModel(params));

        if (!params.src && !params.ifc) {
            this.error("load() param expected: src or IFC");
            return sceneModel; // Return new empty model
        }

        const options: any = {};

        if (params.loadMetadata !== false) {

            const includeTypes = params.includeTypes || this.#includeTypes;
            const excludeTypes = params.excludeTypes || this.#excludeTypes;
            const objectDefaults = params.objectDefaults || this.#objectDefaults;

            if (includeTypes) {
                options.includeTypesMap = {};
                for (let i = 0, len = includeTypes.length; i < len; i++) {
                    options.includeTypesMap[includeTypes[i]] = true;
                }
            }

            if (excludeTypes) {
                options.excludeTypesMap = {};
                for (let i = 0, len = excludeTypes.length; i < len; i++) {
                    options.excludeTypesMap[excludeTypes[i]] = true;
                }
            }

            if (objectDefaults) {
                options.objectDefaults = objectDefaults;
            }

            options.excludeUnclassifiedObjects = (params.excludeUnclassifiedObjects !== undefined) ? (!!params.excludeUnclassifiedObjects) : this.#excludeUnclassifiedObjects;
            options.globalizeObjectIds = (params.globalizeObjectIds !== undefined) ? (!!params.globalizeObjectIds) : this.#globalizeObjectIds;
        }

        this.events.on("initialized", () => {
            if (params.src) {
                this.#loadModel(params.src, params, options, sceneModel);
            } else {
                this.#parseModel(params.ifc, params, options, sceneModel);
            }
        });

        return sceneModel;
    }

    #loadModel(src:string, params:any, options:any, sceneModel:SceneModel) {
        // const spinner = this.viewer.scene.canvas.spinner;
        // spinner.processes++;
        this.#dataSource.getIFC(params.src, (arrayBuffer:ArrayBuffer) => {
                this.#parseModel(arrayBuffer, params, options, sceneModel);
              //  spinner.processes--;
            },
            (errMsg:string) => {
                //spinner.processes--;
                this.error(errMsg);
                sceneModel.events.fire("error", errMsg);
            });
    }

    #parseModel(arrayBuffer:ArrayBuffer, params:any, options:any, sceneModel:SceneModel) {
        if (sceneModel.destroyed) {
            return;
        }
        const stats = params.stats || {};
        stats.sourceFormat = "IFC";
        stats.schemaVersion = "";
        stats.title = "";
        stats.author = "";
        stats.created = "";
        stats.numObjectDatas = 0;
        stats.numPropertySets = 0;
        stats.numObjects = 0;
        stats.numGeometries = 0;
        stats.numTriangles = 0;
        stats.numVertices = 0;

        if (options.wasmPath) {
            this.#ifcAPI.SetWasmPath(options.wasmPath);
        }

        const dataArray = new Uint8Array(arrayBuffer);
        const modelID = this.#ifcAPI.OpenModel(dataArray);

        const lines = this.#ifcAPI.GetLineIDsWithType(modelID, WebIFC.IFCPROJECT);
        const ifcProjectId = lines.get(0);

        const loadMetadata = (params.loadMetadata !== false);

        const metadata: any = loadMetadata ? {
            id: "",
            projectId: "" + ifcProjectId,
            author: "",
            createdAt: "",
            schema: "",
            creatingApplication: "",
            objects: [],
            propertySets: []
        } : null;

        const ctx:any = {
            modelID,
            sceneModel,
            loadMetadata,
            metadata,
            objects: {},
            options,
            log: function (msg:string) {
            },
            nextId: 0,
            stats
        };

        if (loadMetadata) {

            if (options.includeTypes) {
                ctx.includeTypes = {};
                for (let i = 0, len = options.includeTypes.length; i < len; i++) {
                    ctx.includeTypes[options.includeTypes[i]] = true;
                }
            }

            if (options.excludeTypes) {
                ctx.excludeTypes = {};
                for (let i = 0, len = options.excludeTypes.length; i < len; i++) {
                    ctx.excludeTypes[options.excludeTypes[i]] = true;
                }
            }

            this.#parseObjectDatas(ctx);
            this.#parsePropertySets(ctx);
        }

        this.#parseGeometry(ctx);

        sceneModel.finalize();

        if (loadMetadata) {
            const modelDataId = sceneModel.id;
            this.viewer.sceneData.createDataModel(modelDataId, ctx.metadata, options);
        }

        sceneModel.scene.events.once("tick", () => {
            if (sceneModel.destroyed) {
                return;
            }
            sceneModel.scene.events.fire("modelLoaded", sceneModel.id); // FIXME: Assumes listeners know order of these two events
            sceneModel.events.fire("loaded", true, false); // Don't forget the event, for late subscribers
        });
    }

    #parseObjectDatas(ctx:any) {
        const lines = this.#ifcAPI.GetLineIDsWithType(ctx.modelID, WebIFC.IFCPROJECT);
        const ifcProjectId = lines.get(0);
        const ifcProject = this.#ifcAPI.GetLine(ctx.modelID, ifcProjectId);
        this.#parseSpatialChildren(ctx, ifcProject);
    }

    #parseSpatialChildren(ctx:any, ifcElement:any, parentObjectDataId?:any) {
        const objectDataType = ifcElement.__proto__.constructor.name;
        if (ctx.includeTypes && (!ctx.includeTypes[objectDataType])) {
            return;
        }
        if (ctx.excludeTypes && ctx.excludeTypes[objectDataType]) {
            return;
        }
        this.#createDataObject(ctx, ifcElement, parentObjectDataId);
        const objectDataId = ifcElement.GlobalId.value;
        this.#parseRelatedItemsOfType(ctx, ifcElement.expressID, 'RelatingObject', 'RelatedObjects', WebIFC.IFCRELAGGREGATES, objectDataId);
        this.#parseRelatedItemsOfType(ctx, ifcElement.expressID, 'RelatingStructure', 'RelatedElements', WebIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE, objectDataId);
    }

    #createDataObject(ctx:any, ifcElement:any, parentObjectDataId?:any) {
        const id = ifcElement.GlobalId.value;
        const objectDataType = ifcElement.__proto__.constructor.name;
        const objectDataName = (ifcElement.Name && ifcElement.Name.value !== "") ? ifcElement.Name.value : objectDataType;
        const objectData = {
            id: id,
            name: objectDataType,
            type: objectDataName,
            parent: parentObjectDataId
        };
        ctx.metadata.objects.push(objectData);
        ctx.objects[id] = objectData;
        ctx.stats.numObjectDatas++;
    }

    #parseRelatedItemsOfType(ctx:any, id:any, relation:any, related:any, type:any, parentObjectDataId:any) {
        const lines = this.#ifcAPI.GetLineIDsWithType(ctx.modelID, type);
        for (let i = 0; i < lines.size(); i++) {
            const relID = lines.get(i);
            const rel = this.#ifcAPI.GetLine(ctx.modelID, relID);
            const relatedItems = rel[relation];
            let foundElement = false;
            if (Array.isArray(relatedItems)) {
                const values = relatedItems.map((item) => item.value);
                foundElement = values.includes(id);
            } else {
                foundElement = (relatedItems.value === id);
            }
            if (foundElement) {
                const element = rel[related];
                if (!Array.isArray(element)) {
                    const ifcElement = this.#ifcAPI.GetLine(ctx.modelID, element.value);
                    this.#parseSpatialChildren(ctx, ifcElement, parentObjectDataId);
                } else {
                    element.forEach((element2) => {
                        const ifcElement = this.#ifcAPI.GetLine(ctx.modelID, element2.value);
                        this.#parseSpatialChildren(ctx, ifcElement, parentObjectDataId);
                    });
                }
            }
        }
    }

    #parsePropertySets(ctx:any) {
        const lines = this.#ifcAPI.GetLineIDsWithType(ctx.modelID, WebIFC.IFCRELDEFINESBYPROPERTIES);
        for (let i = 0; i < lines.size(); i++) {
            let relID = lines.get(i);
            let rel = this.#ifcAPI.GetLine(ctx.modelID, relID, true);
            if (rel) {
                const relatingPropertyDefinition = rel.RelatingPropertyDefinition;
                if (!relatingPropertyDefinition) {
                    continue;
                }
                const propertySetId = relatingPropertyDefinition.GlobalId.value;
                const props = relatingPropertyDefinition.HasProperties;
                if (props && props.length > 0) {
                    const propertySetType = "Default";
                    const propertySetName = relatingPropertyDefinition.Name.value;
                    const properties = [];
                    for (let i = 0, len = props.length; i < len; i++) {
                        const prop = props[i];
                        const name = prop.Name;
                        const nominalValue = prop.NominalValue;
                        if (name && nominalValue) {
                            const property = {
                                name: name.value,
                                type: nominalValue.type,
                                value: nominalValue.value,
                                valueType: nominalValue.valueType,
                                // @ts-ignore
                                description: undefined
                            };
                            if (prop.Description) {
                                property.description = prop.Description.value;
                            } else if (nominalValue.description) {
                                property.description = nominalValue.description;
                            }
                            properties.push(property);
                        }
                    }
                    const propertySet = {
                        id: propertySetId,
                        type: propertySetType,
                        name: propertySetName,
                        properties: properties
                    };
                    ctx.metadata.propertySets.push(propertySet);
                    ctx.stats.numPropertySets++;
                    const relatedObjects = rel.RelatedObjects;
                    if (!relatedObjects || relatedObjects.length === 0) {
                        for (let i = 0, len = relatedObjects.length; i < len; i++) {
                            const relatedObject = relatedObjects[i];
                            const objectDataId = relatedObject.GlobalId.value;
                            const objectData = ctx.objects[objectDataId];
                            if (objectData) {
                                if (!objectData.propertySetIds) {
                                    objectData.propertySetIds = [];
                                }
                                objectData.propertySetIds.push(propertySetId);
                            }
                        }
                    }
                }
            }
        }
    }

    #parseGeometry(ctx:any) {
        this.#ifcAPI.StreamAllMeshes(ctx.modelID, (flatMesh:any) => {
            // TODO: Can we do geometry reuse with web-ifc?
            const flatMeshExpressID = flatMesh.expressID;
            const placedGeometries = flatMesh.geometries;
            const meshIds = [];
            const properties = this.#ifcAPI.GetLine(ctx.modelID, flatMeshExpressID);
            const globalId = properties.GlobalId.value;
            if (ctx.loadMetadata) {
                const objectDataId = globalId;
                const objectData = ctx.objects[objectDataId];
                if (ctx.includeTypes && (!objectData || (!ctx.includeTypes[objectData.type]))) {
                    return;
                }
                if (ctx.excludeTypes && (!objectData || ctx.excludeTypes[objectData.type])) {
                    return;
                }
            }
            const matrix = math.mat4();
            const origin = math.vec3();
            for (let j = 0, lenj = placedGeometries.size(); j < lenj; j++) {
                const placedGeometry = placedGeometries.get(j);
                const geometry = this.#ifcAPI.GetGeometry(ctx.modelID, placedGeometry.geometryExpressID);
                const vertexData = this.#ifcAPI.GetVertexArray(geometry.GetVertexData(), geometry.GetVertexDataSize());
                const indices = this.#ifcAPI.GetIndexArray(geometry.GetIndexData(), geometry.GetIndexDataSize());
                // De-interleave vertex arrays
                const positions = new Float64Array(vertexData.length / 2);
                const normals = new Float32Array(vertexData.length / 2);
                for (let k = 0, l = 0, lenk = vertexData.length / 6; k < lenk; k++, l += 3) {
                    positions[l + 0] = vertexData[k * 6 + 0];
                    positions[l + 1] = vertexData[k * 6 + 1];
                    positions[l + 2] = vertexData[k * 6 + 2];
                }
                // @ts-ignore
                matrix.set(placedGeometry.flatTransformation);
                math.transformPositions3(matrix, positions);
                const rtcNeeded = worldToRTCPositions(positions, positions, origin);
                if (!ctx.options.autoNormals) {
                    for (let k = 0, l = 0, lenk = vertexData.length / 6; k < lenk; k++, l += 3) {
                        normals[l + 0] = vertexData[k * 6 + 3];
                        normals[l + 1] = vertexData[k * 6 + 4];
                        normals[l + 2] = vertexData[k * 6 + 5];
                    }
                }
                ctx.stats.numGeometries++;
                ctx.stats.numVertices += (positions.length / 3);
                ctx.stats.numTriangles += (indices.length / 3);
                const meshId = ("mesh" + ctx.nextId++);
                ctx.sceneModel.createMesh({
                    id: meshId,
                    primitive: "triangles", // TODO
                    origin: rtcNeeded ? origin : null,
                    positions: positions,
                    normals: ctx.options.autoNormals ? null : normals,
                    indices: indices,
                    color: [placedGeometry.color.x, placedGeometry.color.y, placedGeometry.color.z],
                    opacity: placedGeometry.color.w
                });
                meshIds.push(meshId);
            }
            const entityId = ctx.options.globalizeObjectIds ? math.globalizeObjectId(ctx.sceneModel.id, globalId) : globalId;
            ctx.sceneModel.createEntity({
                id: entityId,
                meshIds: meshIds,
                isObject: true
            });
            ctx.stats.numObjects++;
        });
    }
}

