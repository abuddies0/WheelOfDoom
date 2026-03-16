//@ts-check

/**
 * This is in charge of updating old data
 */

/** @typedef {SavedWheelEntryV1x} SavedWheelEntry A saved wheel entry in JSON format */
/** @typedef {SavedWheelV1x} SavedWheel A saved wheel in JSON format */
/** @typedef {WheelSettingsV1x} WheelSettings Wheel settings in JSON format */

/**
 * @typedef {Object} SavedWheelEntryV0x A wheel entry in JSON format
 * @property {string} text The text value of this wheel entry
 * @property {number} weight The weight of this wheel entry
 * @property {string} tags All tags with this entry comma-separated (ex. 'tag1,tag2,tag3')
 */

/**
 * @typedef {Object} SavedWheelEntryV1x A wheel entry in JSON format
 * @property {string} value The text value of this wheel entry
 * @property {number} weight The weight of this wheel entry
 * @property {Array<string>} tags A list of all tags of this wheel entry
 */

/**
 * @typedef {Object} WheelSettingsV0x The JSON version of all wheel settings
 * @property {number} spinDuration The duration of the spin in milliseconds
 * @property {number} spinStrength The strength of a spin
 * @property {string} spinSound The key for the spinning sound in Wheel.SPIN_SOUNDS
 * @property {string} victorySound The key for the winning sound in Wheel.WIN_SOUNDS
 * @property {string} colorScheme The key for the color scheme in Wheel.COLOR_SCHEMES
 */

/**
 * @typedef {Object} WheelSettingsV1x The JSON version of all wheel settings
 * @property {number} spinDuration The duration of the spin in milliseconds
 * @property {number} spinStrength The strength of a spin
 * @property {string} spinSound The key for the spinning sound in Wheel.SPIN_SOUNDS
 * @property {string} winSound The key for the winning sound in Wheel.WIN_SOUNDS
 * @property {string} colorScheme The key for the color scheme in Wheel.COLOR_SCHEMES
 */

/**
 * @typedef {Object} SavedWheelV0x The key to the object in savedWheels is the name
 * @property {Array<string>} enabledTags A list of all enabled tags
 * @property {Array<string>} knownTags A list of all known tags (deprecated in later versions)
 * @property {WheelSettingsV0x} settings The settings of the wheel
 * @property {Array<SavedWheelEntryV0x>} wheelEntries A list of all wheel entries
 */

/**
 * @typedef {Object} SavedWheelV1x
 * @property {string} name The name of the wheel
 * @property {string} version The version of this saved wheel data (1 is the default) (MAJOR.MINOR.PATCH)
 * @property {WheelSettingsV1x} settings The settings of the wheel
 * @property {string} riggedEntry The value (text) of the rigged entry
 * @property {number} riggedAmount The number of times the wheel should stay rigged
 * @property {Array<SavedWheelEntryV1x>} wheelEntries A list of all wheel entries
 * @property {Array<string>} enabledTags A list of all enabled tags
 */


/**
 * @typedef {Object} Version A better way of saving the version of a wheel.
 * @property {number} major The major version (very important)
 * @property {number} minor The minor version (somewhat important)
 * @property {number} patch The patch version (not important at all, but good to know)
 */


/** @type {Version} If any version is set to this, there was an issue in parsing. */
const INVALID_VERSION = {major: -1, minor: -1, patch: -1};


/**
 * This automatically detects the version of the provided wheel JSON.
 * Usually this is the 'version' field, but that only exists from 1x onwards.
 * @param {Object} json The JSON of a saved wheel (obtained from Wheel.toJSON())
 * @return {Version} The version number of the wheel. INVALID_VERSION if it does not exist.
 */
function detectSavedVersion(json) {
    if ('version' in json && typeof json['version'] === 'string') {
        return getGoodVersion(json['version']) || INVALID_VERSION;
    }
    return getGoodVersion("0.0.0") || INVALID_VERSION;
}


/**
 * Converts the given version string into a version array
 * @param {string} versionString The version of the wheel (typically obtained from reading JSON directly)
 * @return {Version|null} The version of the wheel
 */
function getGoodVersion(versionString) {
    const majorStr = versionString.match(/(?<=^)[0-9]+?(?=\.)/);
    const minorStr = versionString.match(/(?<=\.)[0-9]+?(?=\.)/);
    const patchStr = versionString.match(/(?<=\.)[0-9]+?(?=$)/);
    if (majorStr == null) { return null; }
    if (minorStr == null) { return null; }
    if (patchStr == null) { return null; }
    const major = +majorStr[0];
    const minor = +minorStr[0];
    const patch = +patchStr[0];
    if (Number.isFinite(major) && Number.isFinite(minor) && Number.isFinite(patch)) { return {major: major, minor: minor, patch: patch}; }
    return null;
}


/**
 * Converts a version object into a string version to be saved
 * @param {Version} version The version to convert to a string
 * @return {string} The stringified version: "MAJOR.MINOR.PATCH"
 */
function getSimpleVersion(version) {
    return `${version.major}.${version.minor}.${version.patch}`;
}


/**
 * This updates the given JSON to the latest version JSON.
 * @param {Object} json The JSON of a saved wheel (obtained from Wheel.toJSON())
 * @param {string} key The key of the wheel in the savedWheels (only needed for version 0x)
 * @return {SavedWheel|null} The updated JSON.
 */
export function updateWheelJSON(json, key="Unknown") {
    let version = detectSavedVersion(json);
    let updatedJSON = json;
    if (version == INVALID_VERSION) {
        console.log("Failed to update wheel json because the version was invalid:");
        console.log(json);
        return null;
    }
    
    if (version.major == 0) {
        console.log(`Updated wheel ${key} from V0 to V1!`);
        // @ts-ignore Because updatedJSON should have the right format
        return convertV0_to_V1(updatedJSON, key);
    }

    // No more updates needed
    return null;
}


/**
 * Converts the given Version 0x saved wheel JSON to Version 1x.
 * @param {SavedWheelV0x} jsonV0 The version 0 wheel JSON.
 * @param {string} key The key of the JSON in the saved wheels (because it doesn't have a name property yet)
 * @return {SavedWheelV1x} The updated JSON.
 */
function convertV0_to_V1(jsonV0, key) {
    return {
        name: key,
        version: '1.0.0',
        settings: {
            spinDuration: jsonV0.settings.spinDuration,
            spinStrength: jsonV0.settings.spinStrength,
            colorScheme: jsonV0.settings.colorScheme,
            spinSound: jsonV0.settings.spinSound,
            winSound: jsonV0.settings.victorySound
        },
        riggedEntry: '',
        riggedAmount: 0,
        wheelEntries: jsonV0.wheelEntries.map(wheelEntry => { return {
            // @ts-ignore I'm using value even though it doesn't technically exist
            value: wheelEntry.text != undefined ? wheelEntry.text : (wheelEntry.value),
            weight: wheelEntry.weight,
            tags: typeof wheelEntry.tags === "string" ? wheelEntry.tags.split(',') : wheelEntry.tags
        }}),
        enabledTags: jsonV0.enabledTags
    }
}