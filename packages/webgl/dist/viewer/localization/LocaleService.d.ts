import { EventEmitter } from "../EventEmitter";
/**
 The localization service for a {@link WebViewer}.

 ## Summary

 * A container of string translations ("messages") for various locales.
 * A {@link WebViewer} has its own default LocaleService at {@link WebViewer.localeService}.
 * We can replace that with our own LocaleService implementation via the WebViewer's constructor.
 * WebViewer plugins that need localized translations will attempt to get them for the currently active locale from the LocaleService.
 * Whenever we switch the LocaleService to a different locale, plugins will automatically refresh their translations for that locale.

 ## Usage

 In the example below, we'll create a {@link WebViewer} that uses an {@link WebIFCLoaderPlugin} to load an IFC model, and a
 {@link TreeViewPlugin}, which shows a camera navigation cube in the corner of the canvas.

 We'll also configure our WebViewer with our own LocaleService instance, configured with English, Māori and French
 translations for our TreeViewPlugin.

 We could instead have just used the WebViewer's default LocaleService, but this example demonstrates how we might
 configure the WebViewer our own custom LocaleService subclass.

 The translations fetched by our TreeViewPlugin will be:

 * "NavCube.front"
 * "NavCube.back"
 * "NavCube.top"
 * "NavCube.bottom"
 * "NavCube.left"
 * "NavCube.right"

 <br>
 These are paths that resolve to our translations for the currently active locale, and are hard-coded within
 the TreeViewPlugin.

 For example, if  the LocaleService's locale is set to "fr", then the path "NavCube.back" will drill down
 into ````messages->fr->NavCube->front```` and fetch "Arrière".

 If we didn't provide that particular translation in our LocaleService, or any translations for that locale,
 then the TreeViewPlugin will just fall back on its own default hard-coded translation, which in this case is "BACK".

 [[Run example](https://xeokit.github.io/xeokit-sdk/examples/#localization_NavCubePlugin)]

 ````javascript
 import {WebViewer, LocaleService, TreeViewPlugin, WebIFCLoaderPlugin} from "xeokit-viewer.es.js";

 const viewer = new WebViewer({
      localeService: new LocaleService({
          messages: {
              "en": { // English
                  "NavCube": {
                      "front": "Front",
                      "back": "Back",
                      "top": "Top",
                      "bottom": "Bottom",
                      "left": "Left",
                      "right": "Right"
                  }
              },
              "mi": { // Māori
                  "NavCube": {
                      "front": "Mua",
                      "back": "Tuarā",
                      "top": "Runga",
                      "bottom": "Raro",
                      "left": "Mauī",
                      "right": "Tika"
                  }
              },
              "fr": { // Francais
                  "NavCube": {
                      "front": "Avant",
                      "back": "Arrière",
                      "top": "Supérieur",
                      "bottom": "Inférieur",
                      "left": "Gauche",
                      "right": "Droit"
                  }
              }
          },
          locale: "en"
      })
  });

 const view = new View(viewer, {
     canvasId: "myCanvas"
 });

 view.camera.eye = [-3.93, 2.85, 27.01];
 view.camera.look = [4.40, 3.72, 8.89];
 view.camera.up = [-0.01, 0.99, 0.03];

 const navCubePlugin = new TreeViewPlugin(viewer, {
      canvasID: "myNavCubeCanvas",
      view: view
  });

 const ifcLoader = new WebIFCLoaderPlugin(viewer);

 const model = ifcLoader.load({
     id: "myModel",
     src: "./models/ifc/Duplex.ifc"
 });
 ````

 We can dynamically switch our WebViewer to a different locale at any time, which will update the text on the
 faces of our NavCube:

 ````javascript
 viewer.localeService.locale = "mi"; // Switch to Māori
 ````

 We can load new translations at any time:

 ````javascript
 viewer.localeService.loadMessages({
     "jp": { // Japanese
         "NavCube": {
             "front": "前部",
             "back": "裏",
             "top": "上",
             "bottom": "底",
             "left": "左",
             "right": "右"
         }
     }
 });
 ````

 And we can clear the translations if needed:

 ````javascript
 viewer.localeService.clearMessages();
 ````

 We can get an "updated" event from the LocaleService whenever we switch locales or load messages, which is useful
 for triggering UI elements to refresh themselves with updated translations. Internally, our {@link TreeViewPlugin}
 subscribes to this event, fetching new strings for itself via {@link LocaleService.translate} each time the
 event is fired.

 ````javascript
 viewer.localeService.on("updated", () => {
     console.log( viewer.localeService.translate("NavCube.left") );
 });
 ````
 */
declare class LocaleService {
    #private;
    /**
     * Emits an event each time the locale translations have updated.
     *
     * @event
     */
    readonly onUpdated: EventEmitter<LocaleService, string>;
    /**
     * Constructs a LocaleService.
     *
     * @param cfg LocaleService configuration
     * @param cfg.messages Set of locale translations
     * @param cfg.locale Initial locale
     */
    constructor(cfg?: {
        messages: {};
        locale: string;
    });
    /**
     * Replaces the current set of locale translations.
     *
     * * Fires an "updated" event when done.
     * * Automatically refreshes any plugins that depend on the translations.
     * * Does not change the current locale.
     *
     * ## Usage
     *
     * ````javascript
     * viewer.localeService.setMessages({
     *     messages: {
     *         "en": { // English
     *             "NavCube": {
     *                 "front": "Front",
     *                 "back": "Back",
     *                 "top": "Top",
     *                 "bottom": "Bottom",
     *                 "left": "Left",
     *                 "right": "Right"
     *             }
     *         },
     *         "mi": { // Māori
     *             "NavCube": {
     *                 "front": "Mua",
     *                 "back": "Tuarā",
     *                 "top": "Runga",
     *                 "bottom": "Raro",
     *                 "left": "Mauī",
     *                 "right": "Tika"
     *             }
     *         }
     *    }
     * });
     * ````
     *
     * @param messages The new translations.
     */
    set messages(messages: {
        [key: string]: any;
    });
    /**
     * Loads a new set of locale translations, adding them to the existing translations.
     *
     * * Fires an "updated" event when done.
     * * Automatically refreshes any plugins that depend on the translations.
     * * Does not change the current locale.
     *
     * ## Usage
     *
     * ````javascript
     * viewer.localeService.loadMessages({
     *     "jp": { // Japanese
     *         "NavCube": {
     *             "front": "前部",
     *             "back": "裏",
     *             "top": "上",
     *             "bottom": "底",
     *             "left": "左",
     *             "right": "右"
     *         }
     *     }
     * });
     * ````
     *
     * @param messages The new translations.
     */
    loadMessages(messages?: {
        [key: string]: any;
    }): void;
    /**
     * Clears all locale translations.
     *
     * * Fires an "updated" event when done.
     * * Does not change the current locale.
     * * Automatically refreshes any plugins that depend on the translations, which will cause those
     * plugins to fall back on their internal hard-coded text values, since this method removes all
     * our translations.
     */
    clearMessages(): void;
    /**
     * Gets the list of available locales.
     *
     * These are derived from the currently configured set of translations.
     *
     * @returns The list of available locales.
     */
    get locales(): string[];
    /**
     * Sets the current locale.
     *
     * * Fires an "updated" event when done.
     * * The given locale does not need to be in the list of available locales returned by {@link LocaleService.locales}, since
     * this method assumes that you may want to load the locales at a later point.
     * * Automatically refreshes any plugins that depend on the translations.
     * * We can then get translations for the locale, if translations have been loaded for it, via {@link LocaleService.translate} and {@link LocaleService.translatePlurals}.
     *
     * @param locale The new current locale.
     */
    set locale(locale: string);
    /**
     * Gets the current locale.
     *
     * @returns {String} The current locale.
     */
    get locale(): string;
    /**
     * Translates the given string according to the current locale.
     *
     * Returns null if no translation can be found.
     *
     * @param msg String to translate.
     * @param args Extra parameters.
     * @returns  Translated string if found, else null.
     */
    translate(msg: string, args?: any): string | null;
    /**
     * Translates the given phrase according to the current locale.
     *
     * Returns null if no translation can be found.
     *
     * @param msg Phrase to translate.
     * @param count The plural number.
     * @param [args] Extra parameters.
     * @returns String|null Translated string if found, else null.
     */
    translatePlurals(msg: string, count: number, args: any): string | null;
}
export { LocaleService };