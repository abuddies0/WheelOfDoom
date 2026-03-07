//@ts-check

/**
 * <p> Represents an entire wheel with all of it's functionality including...</p>
 * <ul>
 *  <li> Manipulating entries </li>
 *  <li> Spinning </li>
 *  <li> Exporting </li>
 *  <li> Saving </li>
 * </ul>
 */
export class Wheel {

    /**
     * Creates a new wheel from given name, entries, and DOM canvas element. All of which can be null.
     * @param {string|null} name
     * @param {Array<WheelEntry>} entries 
     * @param {HTMLCanvasElement|null} canvas 
     */
    constructor(name, entries, canvas) {
        /** @type {string|null} The name of the wheel for saving */
        this.name = name;
        /** @type {Array<WheelEntry>} A list of all entries in this wheel */
        this.entries = entries;
        /** @type {HTMLCanvasElement|null} The canvas to draw on */
        this.canvas = canvas;

        /** @type {boolean} If this wheel is actively spinning */
        this.isSpinning = false
        /** @type {Array<WheelEntry>} A list of all active entries (by tags) */
        this.activeEntries = entries;
    }


    /**
     * Spins the wheel at the given strength and duration
     * @param {number} strength The minimum number of spins (for now)
     * @param {number} duration The length of the spin in milliseconds
     * @param {string|null} riggedValue The rigged value of the wheel to land on.
     */
    spin(strength, duration, riggedValue=null) {
        if (this.isSpinning) { return; }

        const winningEntry = this.pullWeightedWheelEntry(riggedValue);
    }


    /**
     * Pulls a wheel entry using the weight system.
     * @param {string|null} riggedValue The rigged value of this wheel to land on. null if not rigged.
     */
    pullWeightedWheelEntry(riggedValue) {

    }


    /**
     * Enables and disables entries based on enabled tags
     * @param {Array<string>} enabledTags A list of all enabled tags.
     */
    updateEntries(enabledTags) {
        
    }


    /**
     * Converts this wheel into a JSON element for saving/exporting.
     * @returns {string} The JSON version of this wheel including entries and name.
     */
    toJSON() {
        // TODO: Implement this.
        return "";
    }


    /**
     * Sets the name of this wheel
     * @param {string|null} name The new name of the wheel
     */
    setName(name) {
        this.name = name;
    }

    /**
     * Sets the entries of this wheel
     * @param {Array<WheelEntry>} entries The new entries
     */
    setEntries(entries) {
        this.entries = entries;
    }

    /**
     * Sets the canvas of this wheel
     * @param {HTMLCanvasElement|null} canvas The new canvas to draw on
     */
    setCanvas(canvas) {
        this.canvas = canvas;
    }

}


/**
 * <p> Represents a single entry in the wheel including </p>
 * <ul>
 *  <li> The value of the entry (text) </li>
 *  <li> The weight of the entry </li>
 *  <li> The tags of the entry </li>
 * </ul>
 */
export class WheelEntry {
    
    /**
     * Creates a new entry. This must be placed in a wheel separately.
     * @param {string} value The value (text) of the entry.
     * @param {number} weight The weight of the entry.
     * @param {Array<string>} tags A list of all tags associated with the entry.
     */
    constructor (value, weight, tags) {
        this.value = value;
        this.weight = weight;
        this.tags = tags;
    }


    /**
     * Checks to see if this entry has the given tag
     * @param {string} tag The tag to check for
     * @returns {boolean} True if the entry contains the tag. False otherwise.
     */
    hasTag(tag) {
        return this.tags.includes(tag);
    }


    /**
     * @returns {string} The text value of the entry
     */
    getValue() {
        return this.value;
    }

    /**
     * @returns {number} The weight of the entry
     */
    getWeight() {
        return this.weight;
    }

    /**
     * @returns {Array<string>} A list of all tags associated with this entry 
     */
    getTags() {
        return this.tags;
    }
}