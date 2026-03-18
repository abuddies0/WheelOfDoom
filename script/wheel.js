//@ts-check

import { getSavedWheels } from "./main.js";

/** @typedef {import("./update.js").SavedWheelEntry} SavedWheelEntry */
/** @typedef {import("./update.js").WheelSettings} WheelSettings */
/** @typedef {import("./update.js").SavedWheel} SavedWheel */



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
    /** @type {boolean} True if the static variables are properly initialized */
    static INITIALIZED = false;

    /**
     * @type {WheelSettings} All the default settings
     */
    static DEFAULT_SETTINGS = {
        spinStrength: 12,
        spinDuration: 2000,
        colorScheme: "classic",
        spinSound: "metalpipe",
        winSound: "yippee"
    };

    /** @type {Record<string, (i:number, l:number)=>string>} All the schemes this wheel can take*/
    static COLOR_SCHEMES = {
        classic: (/**@type {number}*/ i, /**@type {number}*/ l) => `hsl(${i * 360 / l},70%,55%)`,
        cool: (/**@type {number}*/ i, /**@type {number}*/ l) => `hsl(${200 + i * 40 / l},70%,55%)`,
        dark: (/**@type {number}*/ i, /**@type {number}*/ l) => `hsl(220,15%,${35 + i * 15 / l}%)`,
        warm: (/**@type {number}*/ i, /**@type {number}*/ l) => `hsl(${20 + i * 40 / l},75%,55%)`
    };

    /** @type {Record<string, HTMLAudioElement>} All the sounds that can be used while spinning */
    static SPIN_SOUNDS = {
        "metalpipe": new Audio("asset/sound/metal_pipe.mp3"),
        "silence": new Audio("asset/sound/silence.mp3")
    };

    /** @type {Record<string, HTMLAudioElement>} All the sounds that can be used after winning */
    static WIN_SOUNDS = {
        "yippee": new Audio("asset/sound/yippee.mp3"),
        "silence": new Audio("asset/sound/silence.mp3")
    };

    /** @type {Record<string, Wheel>} A pointer to a collection of cached wheels (for speed ups) */
    static CACHED_WHEELS = {};

    /**
     * Initializes all necessary static variables
     */
    static initialize_statics() {
        for (const sound of Object.values(Wheel.SPIN_SOUNDS)) {
            sound.loop = true;
            sound.volume = 0.1;
        }
        for (const sound of Object.values(Wheel.WIN_SOUNDS)) {
            sound.volume = 0.2;
        }
        Wheel.INITIALIZED = true;
    }

    /**
     * Creates a new wheel from given name, wheel entries, and DOM canvas element. All of which can be null.
     * It is the programmer's responsibility to call updateEntries() after construction with a list of active tags.
     * @param {string|null} name
     * @param {Array<WheelEntry>} wheelEntries 
     * @param {HTMLCanvasElement|null} canvas 
     * @param {boolean} makeBuffer True if a buffer should be made. False otherwise.
     */
    constructor(name, wheelEntries, canvas, makeBuffer=false) {
        if (!Wheel.INITIALIZED) {
            Wheel.initialize_statics();
        }
        /** @type {string|null} The name of the wheel for saving */
        this.name = name;
        /** @type {Array<WheelEntry>} A list of all wheel entries in this wheel */
        this.wheelEntries = wheelEntries;
        /** @type {Array<WheelEntry>} A list of all enabled wheel entries in this wheel */
        this.enabledWheelEntries = new Array();
        /** @type {Set<string>} A list of all tags associated with the wheel */
        this.tags = this.getAssociatedTags();
        /** @type {Set<string>} A list of all enabled tags (initially all enabled) */
        this.enabledTags = new Set(this.tags);

        /** @type {HTMLCanvasElement|null} The canvas to draw on. 2.5% buffer on either side of wheel */
        this.canvas = canvas;
        /** @type {CanvasRenderingContext2D|null} */
        this.context = canvas ? canvas.getContext("2d") : null;
        /** @type {HTMLCanvasElement} A buffer to render the wheel on to then be rotated later */
        this.canvasBuffer = document.createElement("canvas");
        /** @type {CanvasRenderingContext2D|null} The context for the buffer to be drawn on */
        this.contextBuffer = this.canvasBuffer.getContext("2d");
        /** @type {boolean} True if the wheel canvas has been buffered. False otherwise. */
        this.buffered = false;
        /** @type {string} The ID of the canvas this wheel uses. "" for none. */
        this.canvasID = "";

        /** @type {boolean} If this wheel is actively spinning */
        this.isSpinning = false;
        /** @type {number} The duration of a wheel spin in milliseconds*/
        this.spinDuration = Wheel.DEFAULT_SETTINGS.spinDuration;
        /** @type {number} The strength of a wheel spin */
        this.spinStrength = Wheel.DEFAULT_SETTINGS.spinStrength;
        /** @type {(i:number, l:number)=>string} The color scheme of the wheel in COLOR_SCHEMES */
        this.colorScheme = Wheel.COLOR_SCHEMES[Wheel.DEFAULT_SETTINGS.colorScheme];
        /** @type {HTMLAudioElement} The sound that plays while spinning */
        this.spinSound = Wheel.SPIN_SOUNDS[Wheel.DEFAULT_SETTINGS.spinSound];
        /** @type {HTMLAudioElement} The sound that plays while spinning */
        this.winSound = Wheel.WIN_SOUNDS[Wheel.DEFAULT_SETTINGS.winSound];

        /** @type {number} The rotation in radians */
        this.rotation = 0.0;
        /** @type {number} The starting rotation of an animation in radians */
        this.initialRotation = 0.0;
        /** @type {number} The target rotation in radians */
        this.targetRotation = 0.0;
        /** @type {number} When the spin started */
        this.spinStartTime = 0.0;
        /** @type {number} When the spin should end */
        this.spinEndTime = 0.0;

        /** @type {number} The total weight of all enabled wheel entries */
        this.totalWeight = 0.0;
        /** @type {number} The unit angle per 1 weight in radians */
        this.sliceUnitAngle = 0.0;
        /** @type {Array<number>} The arc length of each enabled wheel entry */
        this.sliceAngles = new Array();

        /** @type {WheelEntry|null} The winning wheel entry */
        this.winningWheelEntry = null;
        /** @type {boolean} True if the wheel has an unprocessed wheel entry */
        this.hasResult = false;
        /** @type {number} The number of times this wheel is rigged */
        this.riggedAmount = 0;
        /** @type {WheelEntry|null} The rigged wheel entry to land on. Null if not rigged. */
        this.riggedWheelEntry = null;

        /** @type {boolean} True if this has subwheels left to be spun. False otherwise. */
        this.needsSubSpin = false;
        /** @type {Record<string, Wheel>} A list of all sub wheels associated with this wheel. */
        this.subWheels = {};
        /** @type {boolean} True if this is a subwheel. False otherwise. */
        this.isSub = false;
        /** @type {number} How many wheels are above this in the subwheel tree */
        this.subLevel = 0;
        /** @type {Wheel|null} The parent of this wheel */
        this.parentWheel = null;

        /** @type {boolean} True if this wheel is from the cache. False otherwise. */
        this.isCached = false;

        // Initially created with EVERY TAG enabled
        this.updateEntries(this.getAssociatedTags(), makeBuffer);
    }


    /**
     * Creates the basic wheel with entries of Apple, Orange
     */
    static baseWheel() {
        return new Wheel(
            "New Wheel", 
            [new WheelEntry("Apple", 1, new Array()), new WheelEntry("Banana", 2, new Array())],
            null
        );
    }


    /**
     * Creates a new wheel exclusively from JSON
     * @param {SavedWheel} json The JSON obtained from wheel.toJSON()
     * @param {boolean} useCache True if the program should first check the cache for wheels matching this name.
     * @return {Wheel} The wheel that contains that json data
     */
    static fromJSON(json, useCache=false) {
        // Check cache first
        if (useCache && Wheel.CACHED_WHEELS.hasOwnProperty(json.name)) {
            const newWheel = Wheel.baseWheel();
            newWheel.fromCache(Wheel.CACHED_WHEELS[json.name]);
            return newWheel;
        }
        // Ignore cache and make new wheel
        const newWheel = Wheel.baseWheel();
        newWheel.fromJSON(json);
        return newWheel;
    }


    /**
     * Overwrites all the data of this current wheel
     * This copies pretty much everything except the literal canvas
     * @param {Wheel} cachedWheel The cached wheel to overwrite with
     */
    fromCache(cachedWheel) {
        console.log("Loaded wheel from cache!");

        this.setName(cachedWheel.name);
        this.setEntries(cachedWheel.wheelEntries);
        this.enabledTags = cachedWheel.enabledTags;
        this.canvasBuffer = cachedWheel.canvasBuffer;
        this.contextBuffer = cachedWheel.contextBuffer;
        this.isCached = true;
        this.riggedWheelEntry = cachedWheel.riggedWheelEntry;
        this.riggedAmount = cachedWheel.riggedAmount;

        this.updateTags();
        this.updateEntries(this.enabledTags, false);

        this.buffered = true;

        this.spinStrength = cachedWheel.spinStrength;
        this.spinDuration = cachedWheel.spinDuration;
        this.colorScheme = cachedWheel.colorScheme;
        this.spinSound = cachedWheel.spinSound;
        this.winSound = cachedWheel.winSound;
    }


    /**
     * Overwrites all the data of this current wheel.
     * @param {SavedWheel} json The json to overwrite the wheel with.
     */
    fromJSON(json) {
        this.setName(json.name);
        this.setEntries(json.wheelEntries.map(savedEntry => WheelEntry.fromJSON(savedEntry)).filter(e => e !== null));
        if (json.enabledTags instanceof Array) { this.enabledTags = new Set(json.enabledTags); }
        this.riggedWheelEntry = this.getWheelEntryByValue(json.riggedEntry);
        this.riggedAmount = json.riggedAmount;

        this.updateTags();
        this.updateEntries(this.enabledTags);

        this.spinStrength = json.settings.spinStrength;
        this.spinDuration = json.settings.spinDuration;
        this.colorScheme = Wheel.COLOR_SCHEMES[json.settings.colorScheme];
        this.spinSound = Wheel.SPIN_SOUNDS[json.settings.spinSound];
        this.winSound = Wheel.WIN_SOUNDS[json.settings.winSound];
    }


    /**
     * This should only be called when the wheel needs to first be drawn.
     */
    makeBuffer() {
        // Cached wheels cannot be rebuffered
        if (this.isCached) {
            return;
        }
        console.log(`Made new buffer for ${this.name} with ${this.wheelEntries.length} entries. :p`);

        this.buffered = true;
        if (this.canvas == null || this.contextBuffer == null) return;
        this.canvasBuffer.width = this.canvas.width;
        this.canvasBuffer.height = this.canvas.height;
        // Do not render if there are no wheel entries
        if (this.enabledWheelEntries.length == 0) return;
        // Clear the canvas
        this.contextBuffer.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Choose the correct color scheme
        const colorSchemeFunction = this.colorScheme || Wheel.COLOR_SCHEMES.classic;

        // Buffer, center, and rotate the wheel
        const horOffset = this.canvas.width * 0.025;    // 2.5% padding
        const verOffset = this.canvas.height* 0.025;    // 2.5% padding
        const radius = this.canvas.height * 0.475;      // 95% of space is wheel
        this.contextBuffer.save();
        this.contextBuffer.translate(this.canvas.width*0.5, this.canvas.height*0.5);   // Center
        // No rotation (0 degrees)

        // Start drawing slices
        let startAngle = Math.PI * 2;
        const maxWidth = radius * 0.55;
        for (let i = 0; i < this.enabledWheelEntries.length; i++) {
            const wheelEntry = this.enabledWheelEntries[i];
            const text = wheelEntry.getValue();

            this.contextBuffer.beginPath();
            this.contextBuffer.moveTo(0, 0);
            this.contextBuffer.arc(0, 0, radius, startAngle-this.sliceAngles[i], startAngle);
            this.contextBuffer.fillStyle = colorSchemeFunction(i, this.enabledWheelEntries.length);
            this.contextBuffer.fill();

            // TODO: Make this NOT rotate the wheel every single time
            // Rotate the wheel to center text
            this.contextBuffer.save();
            this.contextBuffer.rotate(startAngle - (this.sliceAngles[i])*0.5);

            // TODO: Mathematically determine font
            this.contextBuffer.font = "100px system-ui";
            const widthScale = this.contextBuffer.measureText(text).width / 100;
            const arcLength = radius * this.sliceAngles[i];

            const sizeFromWidth = maxWidth / widthScale;
            const sizeFromArc = arcLength; // height ≈ fontSize

            this.contextBuffer.font = `${Math.max(6, Math.min(sizeFromWidth, sizeFromArc, 22))}px system-ui`;

            this.contextBuffer.fillStyle = "#111";
            this.contextBuffer.textAlign = "right";
            this.contextBuffer.textBaseline = "middle";
            this.contextBuffer.translate(radius*0.99,0);
            this.contextBuffer.fillText(text,0,0);

            this.contextBuffer.restore();

            startAngle -= this.sliceAngles[i];
        }

        this.contextBuffer.restore();
    }


    /**
     * Draws the wheel to the canvas provided
     * TODO: Change this to WebGL for speed reasons
     */
    draw() {
        // Do not spin when there is no canvas
        if (this.canvas == null || this.context == null) return;
        // Rotate canvas
        const radius = 0.5*this.canvas.width;
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.save();
        this.context.translate(radius, radius);
        this.context.rotate(this.rotation);
        this.context.drawImage(this.canvasBuffer, -radius, -radius);
        this.context.restore();

        // Draw pointer
        const pointerSize = this.canvas.height * 0.5 * 0.04;
        this.context.beginPath();
        this.context.fillStyle = "#ef4444";
        this.context.moveTo(this.canvas.width - pointerSize*3, this.canvas.height*0.5);
        this.context.lineTo(this.canvas.width - pointerSize*0.1, this.canvas.height*0.5 - pointerSize*1.4);
        this.context.lineTo(this.canvas.width - pointerSize*0.1, this.canvas.height*0.5 + pointerSize*1.4);
        this.context.closePath();
        this.context.fill();

        this.context.strokeStyle = "black";
        this.context.lineWidth = 0.5;
        this.context.stroke();
    }


    /**
     * Spins the wheel at the given strength and duration
     * @param {number} time The time the wheel is spun in milliseconds
     * @param {string|null} riggedValue The rigged value of the wheel to land on.
     */
    spin(time, riggedValue=null) {
        console.log("SPIN... THAT... WHEELLLLL!");
        if (this.isSpinning) { return; }
        this.isSpinning = true;
        this.hasResult = false;
        this.spinStartTime = time;
        this.spinEndTime = this.spinStartTime + this.spinDuration;

        // Pull wheel entry and set rotation accordingly
        const pulled = this.pullWeightedWheelEntry();
        this.winningWheelEntry = pulled["wheelEntry"];
        // Failed to pull
        if (this.winningWheelEntry == null) {
            this.isSpinning = false;
            console.log("Failed to spin because entry pulled is null.");
            return;
        }
        // Add all necessary subwheels
        this.subWheels = {};
        this.addSubWheels(Array.from(this.winningWheelEntry.getValue().matchAll(/(?<=\{).+?(?=\})/g)).map(e => e[0]));
        if (Object.keys(this.subWheels).length != 0) { this.needsSubSpin = true; }
        // Setup rotation shenanigans
        this.rotation = this.rotation % (2 * Math.PI);
        this.targetRotation =
            (pulled["weight"] * this.sliceUnitAngle) +
            2*Math.PI * Math.ceil(this.spinStrength);
        if (this.targetRotation < 2*Math.PI) { this.targetRotation += 2*Math.PI; }

        this.spinSound.play();
        this.initialRotation = this.rotation;
    }

    static BAGEL = 0;

    /**
     * Adds all of the provided wheel names as sub wheels (if they exist)
     * @param {Array<string>} wheelNames A list of all sub wheel names
     */
    addSubWheels(wheelNames) {
        // Only add subwheels if they exist
        const savedWheels = getSavedWheels();
        const names = Object.keys(savedWheels);

        for (const subName of wheelNames) {
            // Skip if the wheel doesn't exist
            if (!names.includes(subName)) {
                console.log(`Wheel {${subName}} doesn't exist.`)
                continue;
            }
            const subWheel = Wheel.fromJSON(savedWheels[subName], true);
            subWheel.isSub = true;
            subWheel.subLevel = this.subLevel + 1;
            subWheel.parentWheel = this;
            this.subWheels[String(Wheel.BAGEL)] = subWheel;
            Wheel.BAGEL++;
        }
    }


    /**
     * Updates the wheel. Should be called constantly.
     * @param {number} time The program relative time this method was called (milliseconds)
     */
    update(time) {
        if (this.isSpinning && time < this.spinEndTime) {
            // Update rotation
            const p = Math.min((time-this.spinStartTime)/this.spinDuration, 1);
            this.rotation = this.initialRotation + (this.targetRotation - this.initialRotation) * (1-Math.pow(1-p,2));
        }
        else if (this.isSpinning) {
            this.isSpinning = false;
            if (this.spinSound instanceof HTMLAudioElement) {
                this.spinSound.currentTime = 0;
                this.spinSound.pause();
            }
            if (this.winSound instanceof HTMLAudioElement) {
                this.winSound.currentTime = 0;
                this.winSound.play();
            }
            this.hasResult = true;
            this.rotation = this.targetRotation;
        }
        this.draw();
    }


    /**
     * Pulls a wheel entry using the weight system.
     * @return @typedef {Object} @property {number} weight @property {WheelEntry|null} wheelEntry The wheel entry that got pulled and the winning weight
     */
    pullWeightedWheelEntry() {
        // Account for rigging
        if (this.riggedAmount > 0 && this.riggedWheelEntry && this.enabledWheelEntries.map(wheelEntry => wheelEntry.getValue()).includes(this.riggedWheelEntry.getValue())) {
            this.riggedAmount--;
            let weight = 0;
            // Find the weight required to GET TO the rigged entry
            for (const wheelEntry of this.enabledWheelEntries) {
                if (wheelEntry == this.riggedWheelEntry) {
                    break;
                }
                weight += wheelEntry.weight;
            }
            weight += Math.random() * this.riggedWheelEntry.getWeight();
            return {"weight": weight, "wheelEntry": this.riggedWheelEntry};
        }

        // Not rigged (or failed to rig)
        const winningWeight = this.totalWeight * Math.random();
        let tempWeight = winningWeight;

        for (const wheelEntry of this.enabledWheelEntries) {
            tempWeight -= wheelEntry.getWeight();
            if (tempWeight <= 0) {
                return {"weight": winningWeight, "wheelEntry": wheelEntry};
            }
        }

        // Should never reach here
        return {"weight": 0, "wheelEntry": null};
    }


    /**
     * The forces the wheel to land on {riggedTarget} for {riggedAmount} times.
     * Prints out a message depending on if the target was found.
     * @param {string} rigTarget The target to land on
     * @param {number} numberOfRiggedSpins The number of times to land on the target (default=1)
     */
    rig(rigTarget, numberOfRiggedSpins=1) {
        for (const wheelEntry of this.enabledWheelEntries) {
            if (wheelEntry.getValue().includes(rigTarget)) {
                this.riggedWheelEntry = wheelEntry;
                this.riggedAmount = numberOfRiggedSpins
                console.log(`Successfully rigged the wheel to get '${rigTarget}' ${numberOfRiggedSpins} time${numberOfRiggedSpins > 1 ? "s" : ""}!`);
                return;
            }
        }
        console.log(`Failed to rig: could not find entry with the name ${rigTarget}.`);
    }


    /**
     * Gets whatever wheel entry the pointer is currently on
     * @returns {WheelEntry|null} The wheel entry that the pointer is on, or null if something went wrong.
     */
    getPointerWheelEntry() {
        let currentWeightPos = (this.rotation % (2*Math.PI)) / this.sliceUnitAngle;
        for (const wheelEntry of this.enabledWheelEntries) {
            currentWeightPos -= wheelEntry.getWeight();
            if (currentWeightPos <= 0) {
                return wheelEntry;
            }
        }
        return null;
    }


    /**
     * Gets the winning wheel entry
     * Must be called after all necessary subspins are completed
     * @returns {string|null} The winning wheel entry
     */
    getWinningWheelText() {
        // TODO: Make this work on a key-basis, not just a loop
        if (this.winningWheelEntry == null) { return null; }
        let winningText = this.winningWheelEntry.getValue();
        for (const subWheel of Object.values(this.subWheels)) {
            if (this.winningWheelEntry == null) { return null; }
            winningText = winningText.replace(/\{.+?\}/, subWheel.getWinningWheelText() || "");
        }
        return winningText;
    }

    
    /**
     * Declares that this wheel (and all subwheels) have their results handled
     */
    resultHandled() {
        this.hasResult = false;
        for (const subWheel of Object.values(this.subWheels)) {
            subWheel.resultHandled();
        }
    }


    /**
     * Enables and disables wheel entries based on enabled tags
     * @param {Set<string>} enabledTags A list of all enabled tags.
     * @param {boolean} refreshBuffer True if the buffer should be redrawn. (default=true)
     */
    updateEntries(enabledTags, refreshBuffer=true) {
        // Fix enabled wheel entries (based on tags)
        this.enabledWheelEntries = new Array();
        for (const wheelEntry of this.wheelEntries) {
            // Empty tags
            if (wheelEntry.getTags().length == 0) {
                this.enabledWheelEntries.push(wheelEntry);
                continue;
            }
            for (const tag of wheelEntry.getTags()) {
                if (enabledTags.has(tag)) {
                    this.enabledWheelEntries.push(wheelEntry);
                    break;
                }
            }
        }

        // Fix total weight
        this.totalWeight = this.getTotalWeight();

        // Fix slice lengths
        this.sliceUnitAngle = 2 * Math.PI / this.totalWeight;
        this.sliceAngles = new Array();
        for (const wheelEntry of this.enabledWheelEntries) {
            this.sliceAngles.push(wheelEntry.getWeight() * this.sliceUnitAngle);
        }
        this.tags.delete("");

        if (refreshBuffer) {
            this.makeBuffer();
        }   
    }


    /**
     * This should only be called when bulk adding entries.
     */
    updateTags() {
        const associated = this.getAssociatedTags();
        // Difference in sets
        const newTags = [...associated].filter(e => !this.tags.has(e));
        for (const newTag of newTags) {
            this.enabledTags.add(newTag);
        }
        this.tags = associated;
        this.tags.delete("");
    }


    /**
     * Stops all sounds from this wheel
     */
    stopSound() {
        this.spinSound.pause();
    }


    /***********************
     *      MODIFIERS      *
     ***********************/

    /**
     * Adds the given entry to the wheel.
     * If there are any tags that don't exist, this adds them and enables them by default.
     * @param {WheelEntry} wheelEntry The entry to add 
     */
    addEntry(wheelEntry) {
        this.wheelEntries.push(wheelEntry);
        for (const tag of wheelEntry.getTags()) {
            if (!this.tags.has(tag)) {
                this.tags.add(tag);
                this.enabledTags.add(tag);
            }
        }
        this.updateEntries(this.enabledTags);
    }


    /**
     * Removes the given wheel entry from this wheel
     * @param {WheelEntry} wheelEntry The wheel entry to remove
     */
    removeEntry(wheelEntry) {
        // Do not try if the entry doesn't exit
        if (!this.wheelEntries.includes(wheelEntry)) {
            return;
        }
        this.wheelEntries.splice(this.wheelEntries.indexOf(wheelEntry), 1);
    }


    /**
     * Toggles the given tag
     * @param {string} tag The tag to toggle
     */
    toggleTag(tag) {
        // Don't change anything if the tag doesn't exist
        if (!this.tags.has(tag)) {
            return;
        }
        this.setTag(tag, !this.enabledTags.has(tag));
    }


    /**
     * Shuffles the entries array (for no reason btw)
     */
    shuffleEntries() {
        let temp;
        let j;
        for (let i = 0; i < this.wheelEntries.length; i++) {
            j = Math.floor(Math.random() * this.wheelEntries.length);
            temp = this.wheelEntries[i];
            this.wheelEntries[i] = this.wheelEntries[j];
            this.wheelEntries[j] = temp;
        }
    }


    /**
     * Moves the entry at oldIndex to newIndex
     * @param {number} oldIndex The index of the element to move
     * @param {number} newIndex The new index of the element
     */
    moveWheelEntry(oldIndex, newIndex) {
        const movedItem = this.wheelEntries.splice(oldIndex, 1)[0];
        this.wheelEntries.splice(newIndex, 0, movedItem);
    }


    /********************
     *      GETTERS     *
     ********************/

    /**
     * Gets the wheel entry that has the given value
     * @param {string} value The value (text) of the wheel entry
     * @returns {WheelEntry|null} The wheel entry with the given value or null if not found.
     */
    getWheelEntryByValue(value) {
        for (const wheelEntry of this.enabledWheelEntries) {
            if (wheelEntry.getValue() == value) {
                return wheelEntry;
            }
        }
        return null;
    }


    /**
     * Gets the total weight of the enabled entries in this wheel
     * @return {number} The total weight of enabled entries
     */
    getTotalWeight() {
        let weight = 0.0;
        for (const wheelEntry of this.enabledWheelEntries) {
            weight += wheelEntry.getWeight();
        }
        return weight;
    }


    /**
     * Gets the sublevel index of this wheel (AKA the depth along the subwheel tree).
     * @returns {number} The sublevel of this wheel. 0 For parent wheel.
     */
    getSubLevel() {
        return this.subLevel;
    }


    /**
     * Gets the canvas of the wheel
     * @return {HTMLCanvasElement|null} The canvas of this wheel or null if there is no canvas.
     */
    getCanvas() {
        return this.canvas;
    }


    /**
     * Gets the name of the wheel
     * @returns {string} The name of the wheel
     */
    getName() {
        return this.name || "";
    }


    /**
     * Checks to see if this wheel (and all ACTIVE subwheels) is spinning
     * @returns {boolean} True if this wheel (and all ACTIVE subwheels) is done spinning. False otherwise
     */
    isDoneSpinning() {
        if (this.hasResult == false) { return false; }
        if (this.needsSubSpin == true) { return true; }
        for (const subwheel of Object.values(this.subWheels)) {
            if (subwheel.isDoneSpinning() == false) { return false; }
        }
        return true;
    }


    /**
     * Gets a list of all tags that affect this wheel
     * @return {Set<string>} A list of all tags associated with this wheel.
     */
    getAssociatedTags() {
        /** @type {Set<string>} A set of all tags in this wheel*/
        const allTags = new Set();
        for (const wheelEntry of this.wheelEntries) {
            for (const tag of wheelEntry.getTags()) {
                allTags.add(tag);
            }
        }
        
        return allTags;
    }


    /**
     * Get the spin sound in SPIN_SOUNDS by HTML audio element
     * @param {HTMLAudioElement} audio The spin sound to search for
     * @return {string|null} The key of the audio in SPIN_SOUNDS or null
     */
    static getSpinSoundFromAudio(audio) {
        for (const [key, value] of Object.entries(Wheel.SPIN_SOUNDS)) {
            if (value == audio) {
                return key;
            }
        }
        return null;
    }


    /**
     * Get the spin sound in WIN_SOUNDS by HTML audio element
     * @param {HTMLAudioElement} audio The spin sound to search for
     * @return {string|null} The key of the audio in WIN_SOUNDS or null
     */
    static getWinSoundFromAudio(audio) {
        for (const [key, value] of Object.entries(Wheel.WIN_SOUNDS)) {
            if (value == audio) {
                return key;
            }
        }
        return null;
    }


    /**
     * Get the spin sound in COLOR_SCHEMES by function
     * @param {(i:number, l:number)=>string} colorSchemeFunction The function to search for
     * @return {string|null} The key of the function in COLOR_SCHEMES or null
     */
    static getColorSchemeFromFunction(colorSchemeFunction) {
        for (const [key, value] of Object.entries(Wheel.COLOR_SCHEMES)) {
            if (value == colorSchemeFunction) {
                return key;
            }
        }
        return null;
    }


    /**
     * Checks whether this wheel is a subwheel.
     * @returns {boolean} True if this is a subwheel. False otherwise.
     */
    isSubwheel() {
        return this.isSub;
    }


    /**
     * Gets all wheel entries associated with this wheel (enabled & disabled)
     * @returns {Array<WheelEntry>} All enabled & disabled wheel entries
     */
    getWheelEntries() {
        return this.wheelEntries;
    }


    /**
     * Checks to see if the current winning entry requires sub spins
     * @returns {boolean} True if there are unresolved sub spins. False otherwise.
     */
    requiresSubSpins() {
        return this.needsSubSpin;
    }


    /**
     * Converts this wheel into a JSON element for saving/exporting.
     * @returns {SavedWheel} The JSON version of this wheel including wheel entries and name.
     */
    toJSON() {
        return JSON.parse(JSON.stringify({
            "name": this.name,
            "version": "1.0.0",
            "settings": {
                "spinDuration": this.spinDuration,
                "spinStrength": this.spinStrength,
                "spinSound": Wheel.getSpinSoundFromAudio(this.spinSound),
                "winSound": Wheel.getWinSoundFromAudio(this.winSound),
                "colorScheme": Wheel.getColorSchemeFromFunction(this.colorScheme),
            },
            "riggedEntry": this.riggedWheelEntry ? this.riggedWheelEntry.getValue() : null,
            "riggedAmount": this.riggedAmount,
            "wheelEntries": this.wheelEntries.map(entry => entry.toJSON()),
            "enabledTags": Array.from(this.enabledTags)
        }));
    }

    
    /********************
     *      SETTERS     *
     ********************/

    /**
     * Sets the name of this wheel
     * @param {string|null} name The new name of the wheel
     */
    setName(name) {
        this.name = name;
    }


    /**
     * Sets the wheel entries of this wheel
     * @param {Array<WheelEntry>} wheelEntries The new wheel entries
     */
    setEntries(wheelEntries) {
        this.wheelEntries = wheelEntries;
        this.updateTags();
    }


    /**
     * Forcefully enables/disables the given tag
     * @param {string} tag The tag to enable/disable
     * @param {boolean} isEnabled True if it should be enabled. False otherwise.
     */
    setTag(tag, isEnabled) {
        // Don't change anything if the tag doesn't exist
        if (!this.tags.has(tag)) {
            return;
        }
        if (isEnabled) {
            this.enabledTags.add(tag);
        }
        else if (this.enabledTags.has(tag)) {
            this.enabledTags.delete(tag);
        }

        this.updateEntries(this.enabledTags);
    }


    /**
     * Sets the canvas of this wheel
     * @param {HTMLCanvasElement|null} canvas The new canvas to draw on
     */
    setCanvas(canvas) {
        this.canvas = canvas;
        this.context = canvas ? canvas.getContext("2d") : null;
        this.wheelWidth = this.canvas ? this.canvas.width-20 : 600;
        this.wheelHeight = this.canvas ? this.canvas.height-20 : 600;
    }


    /**
     * Sets the canvas of this wheel to its saved canvas ID
     */
    setCanvasFromID() {
        // If no ID, then skip
        if (this.canvasID == null) { return; }
        const canvas = document.getElementById(this.canvasID);
        if (canvas == null || !(canvas instanceof HTMLCanvasElement)) { return; }
        this.setCanvas(canvas);
    }


    /**
     * Saves the ID of the canvas this wheel should use.
     * Note: This does NOT use the canvas automatically. You must call setCanvasFromID.
     * @param {string} id The ID of the canvas to be used. 
     */
    setCanvasID(id) {
        this.canvasID = id;
    }


    /**
     * Sets the spin duration.
     * @param {number} duration The duration in milliseconds
     */
    setSpinDuration(duration) {
        this.spinDuration = duration;
    }


    /**
     * Sets the spin strength.
     * @param {number} strength The strength in unknown units.
     */
    setSpinStrength(strength) {
        this.spinStrength = strength;
    }


    /**
     * Sets the sound that plays while the wheel is spinning
     * @param {HTMLAudioElement|null} sound The sound to set the wheel to. Refer to Wheel.SPIN_SOUNDS
     */
    setSpinSound(sound) {
        // Only updates if sound exists
        if (sound != null) {
            this.spinSound = sound;
        }
    }


    /**
     * Sets the sound that plays when the wheel finishes spinning
     * @param {HTMLAudioElement|null} sound The sound to set the wheel to. Refer to Wheel.WIN_SOUNDS
     */
    setWinSound(sound) {
        // Only updates if sound exists
        if (sound != null) {
            this.winSound = sound;
        }
    }
    

    /**
     * Sets the color scheme of the wheel.
     * @param {((i:number, l:number)=>string)|null} scheme The sound to set the wheel to. Refer to Wheel.COLOR_SCHEMES
     */
    setColorScheme(scheme) {
        // Only updates if sound exists
        if (scheme != null) {
            this.colorScheme = scheme;
        }
    }


    /**
     * Changes whether this wheel still needs subwheels to be handled.
     * @param {boolean} stillNeedsSubSpins True if all subwheels have been handled. False otherwise.
     */
    setNeedsSubSpins(stillNeedsSubSpins) {
        this.needsSubSpin = stillNeedsSubSpins;
    }


    /**
     * Clears all the subwheels of this wheel
     */
    clearSubwheels() {
        this.subWheels = {};
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
     * Creates a new wheel entry from the given JSON.
     * @param {SavedWheelEntry} json The JSON containing value, weight, and tags
     * @return {WheelEntry|null} The wheel entry that fits the json or null if the JSON doesn't have the necessary elements.
     */
    static fromJSON(json) {
        // @ts-ignore Because the properties may or may not exist anyway
        return new WheelEntry(json.value, json.weight, json.tags) || null;
    }

    /**
     * Creates a new wheel entry from the given JSON.
     * @param {string} text The JSON containing value, weight, and tags
     * @return {WheelEntry|null} The wheel entry that fits the json or null if the JSON doesn't have the necessary elements.
     */
    static fromText(text) {
        // TODO: Make this better with delimiters
        const parts = text.split("|").map(p => p.trim());
        return new WheelEntry(parts[0], Number(parts[1]), parts[2].split(",").map(t => t.trim())) || 
                new WheelEntry(parts[0], Number(parts[1]), new Array()) ||
                new WheelEntry(parts[0], 1, new Array()) ||
                null;
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

    /**
     * Converts the wheel entry into a JSON element
     * @return {SavedWheelEntry} The JSON of this element including value, weight, & tags
     */
    toJSON() {
        const jsonTemp = {
            "value": this.value,
            "weight": this.weight,
            "tags": this.tags
        }
        return JSON.parse(JSON.stringify(jsonTemp));
    }

    /**
     * Converts the wheel entry into text form (to be displayed in the text editor)
     * @return {string} The pipe-separated value, weight, tags representation of the entry
     */
    toText() {
        return this.value + " | " + this.weight + " | " + this.tags.toString();
    }

    /**
     * Sets the value of the wheel entry to something new
     * @param {string} value The new value (text) to set the wheel entry to
     */
    setValue(value) {
        this.value = value;
    }

    /**
     * Sets the weight of the wheel entry to something new
     * @param {number} weight The new weight to set the wheel entry to
     */
    setWeight(weight) {
        this.weight = weight;
    }

    /**
     * Sets the tags of the wheel entry to something new
     * @param {Array<string>} tags The new tags to set the wheel entry to
     */
    setTags(tags) {
        this.tags = tags;
    }
}