 // @ts-check

 const DOM_ELEMENTS = {
     canvas: document.getElementById("mainWheelCanvas"),
     wheelWrapper: document.getElementById("wheel-wrapper"),

    // Wheel Entries
     tableBody: document.querySelector("#wheelEntryTable tbody"),
     tagFiltersDiv: document.getElementById("tagFilters"),
     textModeSwitch: document.getElementById("textModeSwitch"),
     textModeArea: document.getElementById("textModeArea"),
     shuffleBtn: document.getElementById("shuffleBtn"),
     wheelEntriesCountSpan: document.getElementById("wheelEntriesCount"),

    // General toolbar buttons
     newWheelBtn: document.getElementById("newWheelBtn"),
     saveWheelBtn: document.getElementById("saveWheelBtn"),
     saveAsWheelBtn: document.getElementById("saveAsWheelBtn"),
     loadWheelBtn: document.getElementById("loadWheelBtn"),
     copyBtn: document.getElementById("copyBtn"),
     importFile: document.getElementById("importFile"),
     importBtn: document.getElementById("importBtn"),
     exportBtn: document.getElementById("exportBtn"),
     spinBtn: document.getElementById("spinBtn"),

    // Modals
     modal: document.getElementById("winnerModal"),
     winnerText: document.getElementById("winnerText"),
     closeModalBtn: document.getElementById("closeModalBtn"),

     settingsBtn: document.getElementById("settingsBtn"),
     settingsModal: document.getElementById("settingsModal"),
     closeSettingsBtn: document.getElementById("closeSettingsBtn"),

     confirmSaveAsBtn: document.getElementById("confirmSaveAsBtn"),
     cancelSaveAsBtn: document.getElementById("cancelSaveAsBtn"),

     savedWheelsList: document.getElementById("savedWheelsList"),
     closeLoadBtn: document.getElementById("closeLoadBtn"),

     saveModal: document.getElementById("saveModal"),
     loadModal: document.getElementById("loadModal"),

     saveNameInput: document.getElementById("saveNameInput"),
     loadList: document.getElementById("loadList"),

    // Wheel Settings
     spinStrengthSlider: document.getElementById("spinStrengthSlider"),
     spinStrengthNumber: document.getElementById("spinStrengthNumber"),
     spinDurationSlider: document.getElementById("spinDurationSlider"),
     spinDurationNumber: document.getElementById("spinDurationNumber"),
     colorSchemeSelect: document.getElementById("colorSchemeSelect"),
     spinSoundSelect: document.getElementById("spinSoundSelect"),
     victorySoundSelect: document.getElementById("victorySoundSelect"),

     // Debug Stuff
     fpsCounter: document.getElementById("fps")
};


/**
 * Initializes all the DOM stuff given the primary wheel
 * @param {Wheel} editingWheel The wheel that is currently being edited
 * @param {() => void} saveState Call this to save the settings in the wheel
 * @param {() => void} spin Call this to spin the wheel.
 */
function initializeDOMStuff(editingWheel, saveState, spin) {
    if (DOM_ELEMENTS.cancelSaveAsBtn != null) {
        DOM_ELEMENTS.cancelSaveAsBtn.onclick = () => { if (DOM_ELEMENTS.saveModal !=  null) DOM_ELEMENTS.saveModal.classList.add("hidden")};
    }
    if (DOM_ELEMENTS.closeLoadBtn != null && DOM_ELEMENTS.loadModal !=  null) {
        DOM_ELEMENTS.closeLoadBtn.onclick = () => { if (DOM_ELEMENTS.loadModal !=  null) DOM_ELEMENTS.loadModal.classList.add("hidden")};
    }

    // General Modal
    if (DOM_ELEMENTS.closeModalBtn != null) {
        DOM_ELEMENTS.closeModalBtn.onclick = () => {
            if (DOM_ELEMENTS.modal == null) { return; }
            DOM_ELEMENTS.modal.classList.add("hidden");
        };
    }

    // Settings
    if (DOM_ELEMENTS.settingsBtn != null) {
        DOM_ELEMENTS.settingsBtn.onclick = () => {
            if (DOM_ELEMENTS.settingsModal != null)
                DOM_ELEMENTS.settingsModal.classList.remove("hidden");

            if (DOM_ELEMENTS.spinStrengthSlider != null && DOM_ELEMENTS.spinStrengthSlider instanceof HTMLInputElement)
                DOM_ELEMENTS.spinStrengthSlider.value = String(editingWheel.spinStrength);
            if (DOM_ELEMENTS.spinStrengthNumber != null && DOM_ELEMENTS.spinStrengthNumber instanceof HTMLInputElement)
                DOM_ELEMENTS.spinStrengthNumber.value = String(editingWheel.spinStrength);

            if (DOM_ELEMENTS.spinDurationSlider != null && DOM_ELEMENTS.spinDurationSlider instanceof HTMLInputElement)
                DOM_ELEMENTS.spinDurationSlider.value = String(editingWheel.spinDuration);
            if (DOM_ELEMENTS.spinDurationNumber != null && DOM_ELEMENTS.spinDurationNumber instanceof HTMLInputElement)
                DOM_ELEMENTS.spinDurationNumber.value = String(editingWheel.spinDuration);

            if (DOM_ELEMENTS.colorSchemeSelect != null && DOM_ELEMENTS.colorSchemeSelect instanceof HTMLInputElement)
                DOM_ELEMENTS.colorSchemeSelect.value = Wheel.getColorSchemeFromFunction(editingWheel.colorScheme) || "";
            if (DOM_ELEMENTS.spinSoundSelect != null && DOM_ELEMENTS.spinSoundSelect instanceof HTMLInputElement)
                DOM_ELEMENTS.spinSoundSelect.value = Wheel.getSpinSoundFromAudio(editingWheel.spinSound) || "";
            if (DOM_ELEMENTS.victorySoundSelect != null && DOM_ELEMENTS.victorySoundSelect instanceof HTMLInputElement)
                DOM_ELEMENTS.victorySoundSelect.value = Wheel.getWinSoundFromAudio(editingWheel.winSound) || "";
        };
    }

    if (DOM_ELEMENTS.closeSettingsBtn != null) {
        DOM_ELEMENTS.closeSettingsBtn.onclick = () => {
            if (DOM_ELEMENTS.settingsModal == null) { return null; }
            DOM_ELEMENTS.settingsModal.classList.add("hidden");
        };
    }

    // Spin the wheel
    if (DOM_ELEMENTS.wheelWrapper != null && DOM_ELEMENTS.wheelWrapper instanceof HTMLInputElement) {
        DOM_ELEMENTS.wheelWrapper.onclick = () => { spin(); };
    }
    if (DOM_ELEMENTS.spinBtn != null) {
        DOM_ELEMENTS.spinBtn.onclick = () => { spin(); };
    }

    // Import / Export
    if (DOM_ELEMENTS.exportBtn != null) {
        DOM_ELEMENTS.exportBtn.onclick = () => {
            if (editingWheel == null) { return; }
            const blob = new Blob(
                [JSON.stringify(editingWheel.toJSON(), null, 2)],
                { type: "application/json" }
            );

            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "wheel.json";
            a.click();

            URL.revokeObjectURL(a.href);

            showCard("Exported!", 3);
        };
    }
    
    if (DOM_ELEMENTS.importBtn != null) {
        DOM_ELEMENTS.importBtn.onclick = () => { if (DOM_ELEMENTS.importFile != null) DOM_ELEMENTS.importFile.click() };
    }
    
    if (DOM_ELEMENTS.importFile != null) {
        DOM_ELEMENTS.importFile.onchange = e => {
            if (e == null || e.target == null) { return; }
            // @ts-ignore
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();

            reader.onload = () => {
                try {
                    const data = JSON.parse(reader.result ? String(reader.result) : "");
                    loadWheelData(data); // use the proper loader
                    showCard(`Imported ${file.name}`, 3);
                } catch(err) {
                    console.error(err);
                    showCard("Failed to import file", 3);
                }
            };

            reader.readAsText(file);
            saveState();
        };
    }

    // Copy
    if (DOM_ELEMENTS.copyBtn != null) {
        DOM_ELEMENTS.copyBtn.onclick = () => {
            if (editingWheel == null) { return; }
            navigator.clipboard.writeText(JSON.stringify(editingWheel.toJSON()));
            showCard("Copied JSON", 2);
        };
    }
    
    // Saving / Loading
    function saveAs() {
        if (DOM_ELEMENTS.saveNameInput == null ||
            DOM_ELEMENTS.saveModal == null ||
            DOM_ELEMENTS.saveNameInput == null ||
            !(DOM_ELEMENTS.saveNameInput instanceof HTMLInputElement)
        ) { return; }
        DOM_ELEMENTS.saveNameInput.value = editingWheel.getName();
        DOM_ELEMENTS.saveModal.classList.remove("hidden");
        DOM_ELEMENTS.saveNameInput.focus();

        saveState();
    }

    if (DOM_ELEMENTS.confirmSaveAsBtn != null) {
        DOM_ELEMENTS.confirmSaveAsBtn.onclick = () => {
            if (DOM_ELEMENTS.saveNameInput == null || 
                !(DOM_ELEMENTS.saveNameInput instanceof HTMLInputElement) ||
                editingWheel == null ||
                DOM_ELEMENTS.saveModal == null
            ) { return; }
            const name = DOM_ELEMENTS.saveNameInput.value.trim();
            if (!name) return;

            const wheels = getSavedWheels();

            // @ts-ignore
            const wheelJSON = editingWheel.toJSON();
            wheelJSON['name'] = name;
            wheels[name] = wheelJSON;

            editingWheel.setName(name);
            // @ts-ignore
            setSavedWheels(wheels);

            DOM_ELEMENTS.saveModal.classList.add("hidden");
            showCard("Saved Successfully!", 4);
        };
    }

    if (DOM_ELEMENTS.cancelSaveAsBtn != null) {
        DOM_ELEMENTS.cancelSaveAsBtn.onclick = () => {
            if (DOM_ELEMENTS.saveModal != null) { DOM_ELEMENTS.saveModal.classList.add("hidden"); }
        }
    }

    if (DOM_ELEMENTS.saveWheelBtn != null) {
        DOM_ELEMENTS.saveWheelBtn.onclick = () => {
            if (editingWheel == null) { return null; }
            if (editingWheel.getName() == null || editingWheel.getName() == "") {
                saveAs();
                return;
            }

            const wheels = getSavedWheels();
            // @ts-ignore
            wheels[editingWheel.getName()] = editingWheel.toJSON();

            showCard(`Saved '${editingWheel.getName()}'`, 2)

            // @ts-ignore
            setSavedWheels(wheels);
        };
    }

    if (DOM_ELEMENTS.saveAsWheelBtn != null) {
        DOM_ELEMENTS.saveAsWheelBtn.onclick = () => {
            saveAs();
        };
    }

    if (DOM_ELEMENTS.loadWheelBtn != null) {
        DOM_ELEMENTS.loadWheelBtn.onclick = () => {
            if (DOM_ELEMENTS.loadModal == null) { return; }
            DOM_ELEMENTS.loadModal.classList.remove("hidden");
            rebuildLoadMenu();
        };
    }

    function rebuildLoadMenu() {
        if (DOM_ELEMENTS.loadList == null) { return; }
        DOM_ELEMENTS.loadList.innerHTML = "";

        const wheels = getSavedWheels();

        Object.keys(wheels).forEach(name => {

            const row = document.createElement("div");
            row.className = "wheelRow";

            const title = document.createElement("div");
            title.className = "wheelName";
            title.textContent = name;

            const btns = document.createElement("div");
            btns.className = "wheelBtns";

            const loadBtn = document.createElement("button");
            loadBtn.className = "primaryBtn";
            loadBtn.textContent = "Load";
            loadBtn.onclick = () => {
                if (DOM_ELEMENTS.loadModal == null) { return; }
                loadWheel(name);
                DOM_ELEMENTS.loadModal.classList.add("hidden");
                showCard("Wheel Loaded", 3);
            };

            const delBtn = document.createElement("button");
            delBtn.className = "deleteBtn";
            delBtn.textContent = "Delete";
            delBtn.onclick = () => {
                if (!confirm(`Delete "${name}"?`)) return;

                const wheels = getSavedWheels();
                // @ts-ignore
                delete wheels[name];
                // @ts-ignore
                setSavedWheels(wheels);

                rebuildLoadMenu();
                showCard("Deleted", 3);
            };

            btns.append(loadBtn, delBtn);
            row.append(title, btns);
            if (DOM_ELEMENTS.loadList == null) { return; }
            DOM_ELEMENTS.loadList.append(row);
        });
    }

    /** @param {string} name The name of the wheel */
    function loadWheel(name) {
        if (editingWheel == null) { return; }
        const wheels = getSavedWheels();
        // @ts-ignore
        if (!wheels[name]) {
            showCard(`Wheel "${name}" not found!`, 3);
            return;
        }

        // @ts-ignore
        loadWheelData(wheels[name])
        showCard(`Wheel "${name}" loaded!`, 3);
    }

    if (DOM_ELEMENTS.newWheelBtn != null) {
        DOM_ELEMENTS.newWheelBtn.onclick = () => {
            loadWheelData(Wheel.baseWheel().toJSON()); 
            showCard("Made New Wheel!", 2);
        }

        saveState();
    }

    /* ------------ WHEEL SETTINGS ------------ */
    
    /** @param {number} value */
    function syncSpinStrength(value) {
        if (editingWheel == null) { return; }
        editingWheel.spinStrength = value;
        if (DOM_ELEMENTS.spinStrengthSlider != null && DOM_ELEMENTS.spinStrengthSlider instanceof HTMLInputElement)
            DOM_ELEMENTS.spinStrengthSlider.value = String(value);
        if (DOM_ELEMENTS.spinStrengthNumber != null && DOM_ELEMENTS.spinStrengthNumber instanceof HTMLInputElement)
            DOM_ELEMENTS.spinStrengthNumber.value = String(value);
        saveState();
    }
    
    if (DOM_ELEMENTS.spinStrengthSlider != null) {
        DOM_ELEMENTS.spinStrengthSlider.oninput = e => {
            if (e.target != null) {
                // @ts-ignore
                syncSpinStrength(Number(e.target.value));
            }
        };
    }
    
    if (DOM_ELEMENTS.spinStrengthNumber != null) {
        DOM_ELEMENTS.spinStrengthNumber.oninput = e => {
            if (e.target != null) {
                // @ts-ignore
                syncSpinStrength(Number(e.target.value));
            }
        };
    }
    
    /** @param {number} value */
    function syncSpinDuration(value) {
        if (editingWheel == null) { return; }
        editingWheel.spinDuration = value;
        if (DOM_ELEMENTS.spinDurationSlider != null && DOM_ELEMENTS.spinDurationSlider instanceof HTMLInputElement)
            DOM_ELEMENTS.spinDurationSlider.value = String(value);
        if (DOM_ELEMENTS.spinDurationNumber != null && DOM_ELEMENTS.spinDurationNumber instanceof HTMLInputElement)
            DOM_ELEMENTS.spinDurationNumber.value = String(value);
        saveState();
    }
    
    if (DOM_ELEMENTS.spinDurationSlider != null) {
        DOM_ELEMENTS.spinDurationSlider.oninput = e => {
            if (e.target != null) {
                // @ts-ignore
                syncSpinDuration(Number(e.target.value));
            }
        };
    }

    if (DOM_ELEMENTS.spinDurationNumber != null) {
        DOM_ELEMENTS.spinDurationNumber.oninput = e => {
            if (e.target != null) {
                // @ts-ignore
                syncSpinDuration(Number(e.target.value));
            }
        };
    }

    if (DOM_ELEMENTS.colorSchemeSelect != null) {
        DOM_ELEMENTS.colorSchemeSelect.oninput = e => {
            if (e.target != null) {
                // @ts-ignore
                editingWheel.colorScheme = Wheel.COLOR_SCHEMES[e.target.value]
            }
            saveState();
        };
    }

    if (DOM_ELEMENTS.spinSoundSelect != null) {
        DOM_ELEMENTS.spinSoundSelect.oninput = e => {
            if (e.target != null) {
                // @ts-ignore
                editingWheel.spinSound = Wheel.SPIN_SOUNDS[e.target.value]
            }
            saveState();
        };
    }

    if (DOM_ELEMENTS.victorySoundSelect != null) {
        DOM_ELEMENTS.victorySoundSelect.oninput = e => {
            if (e.target != null) {
                // @ts-ignore
                editingWheel.winSound = Wheel.WIN_SOUNDS[e.target.value]
            }
            saveState();
        };
    }

    if (editingWheel != null && DOM_ELEMENTS.canvas != null && DOM_ELEMENTS.canvas instanceof HTMLCanvasElement) {
        editingWheel.setCanvas(DOM_ELEMENTS.canvas);
    }
}

/**
 * @typedef {Object} SavedWheelEntry A wheel entry in JSON format
 * @property {string} value The text value of this wheel entry
 * @property {number} weight The weight of this wheel entry
 * @property {Array<string>} tags A list of all tags of this wheel entry
 */

/**
 * @typedef {Object} WheelSettings The JSON version of all wheel settings
 * @property {number} spinDuration The duration of the spin in milliseconds
 * @property {number} spinStrength The strength of a spin
 * @property {string} spinSound The key for the spinning sound in Wheel.SPIN_SOUNDS
 * @property {string} winSound The key for the winning sound in Wheel.WIN_SOUNDS
 * @property {string} colorScheme The key for the color scheme in Wheel.COLOR_SCHEMES
 */

/**
 * @typedef {Object} SavedWheel
 * @property {string} name The name of the wheel
 * @property {WheelSettings} settings The settings of the wheel
 * @property {string} riggedEntry The value (text) of the rigged entry
 * @property {number} riggedAmount The number of times the wheel should stay rigged
 * @property {Array<SavedWheelEntry>} wheelEntries A list of all wheel entries
 * @property {Array<string>} enabledTags A list of all enabled tags
 */




/**
 * <p> Represents an entire wheel with all of it's functionality including...</p>
 * <ul>
 *  <li> Manipulating entries </li>
 *  <li> Spinning </li>
 *  <li> Exporting </li>
 *  <li> Saving </li>
 * </ul>
 */
class Wheel {
    /** @type {boolean} True if the static variables are properly initialized */
    static INITIALIZED = false;

    /**
     * @type {WheelSettings} All the default settings
     */
    static DEFAULT_SETTINGS = {
        spinStrength: 12,
        spinDuration: 5000,
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

    /**
     * Initializes all necessary static variables
     */
    static initialize_statics() {
        for (const [key, sound] of Object.entries(Wheel.SPIN_SOUNDS)) {
            sound.loop = true;
            sound.volume = 0.1;
        }
        for (const [key, sound] of Object.entries(Wheel.WIN_SOUNDS)) {
            sound.loop = true;
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
     */
    constructor(name, wheelEntries, canvas) {
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

        // Initially created with EVERY TAG enabled
        this.updateEntries(this.getAssociatedTags());
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
     * @return {Wheel} The wheel that contains that json data
     */
    static fromJSON(json) {
        const newWheel = Wheel.baseWheel();
        newWheel.fromJSON(json);
        return newWheel;
    }


    /**
     * Overwrites all the data of this current wheel.
     * 
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
    drawSegments() {
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
            // let size = 22;
            // this.contextBuffer.font = `${size}px system-ui`;
            // let textMeasure = this.contextBuffer.measureText(text);
            // const arcLength = this.sliceAngles[i] * radius;
            // while ((textMeasure.width > radius*0.55 || textMeasure.fontBoundingBoxAscent > arcLength) && size > 6) {
            //     size--;
            //     this.contextBuffer.font = `${size}px system-ui`;
            //     textMeasure = this.contextBuffer.measureText(text);
            // }

            this.contextBuffer.fillStyle = "#111";
            // if (size > 18) {
            //     this.contextBuffer.textAlign = "center";
            //     this.contextBuffer.textBaseline = "middle";
            //     this.contextBuffer.translate(radius*0.6,0);
            // } 
            // // Force aligns at the edge when the wheel entry is small
            // else {
            //    this.contextBuffer.textAlign = "right";
            //    this.contextBuffer.textBaseline = "middle";
            //    this.contextBuffer.translate(radius*0.99,0);
            // }
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
        // const pointerSize = this.canvas.height * 0.5 * 0.04;
        // this.context.beginPath();
        // this.context.fillStyle = "#ef4444";
        // this.context.moveTo(this.canvas.width - pointerSize*3, this.canvas.height*0.5);
        // this.context.lineTo(this.canvas.width - pointerSize*0.1, this.canvas.height*0.5 - pointerSize*1.4);
        // this.context.lineTo(this.canvas.width - pointerSize*0.1, this.canvas.height*0.5 + pointerSize*1.4);
        // this.context.closePath();
        // this.context.fill();

        // this.context.strokeStyle = "black";
        // this.context.lineWidth = 1;
        // this.context.stroke();
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
            const subWheel = Wheel.fromJSON(savedWheels[subName]);
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
            this.spinSound.currentTime = 0;
            this.spinSound.pause();
            this.winSound.currentTime = 0;
            this.winSound.play();
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
     * Checks to see if the current winning entry requires sub spins
     * @returns {boolean} True if there are unresolved sub spins. False otherwise.
     */
    requiresSubSpins() {
        return this.needsSubSpin;
    }


    /**
     * Changes whether this wheel still needs subwheels to be handled.
     * @param {boolean} stillNeedsSubSpins True if all subwheels have been handled. False otherwise.
     */
    setNeedsSubSpins(stillNeedsSubSpins) {
        this.needsSubSpin = stillNeedsSubSpins;
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
     */
    updateEntries(enabledTags) {
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

        this.drawSegments();
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
     * Gets the name of the wheel
     * @returns {string} The name of the wheel
     */
    getName() {
        return this.name || "";
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
     * Converts this wheel into a JSON element for saving/exporting.
     * @returns {SavedWheel} The JSON version of this wheel including wheel entries and name.
     */
    toJSON() {
        return JSON.parse(JSON.stringify({
            "name": this.name,
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
}





/**
 * <p> Represents a single entry in the wheel including </p>
 * <ul>
 *  <li> The value of the entry (text) </li>
 *  <li> The weight of the entry </li>
 *  <li> The tags of the entry </li>
 * </ul>
 */
class WheelEntry {
    
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
}// @ts-check


/** @type {boolean} True if editing entries through text */
let textModeActive = false;

/** @type {Array<Wheel>} All the wheels on screen. The first wheel in the list is the one being edited on the left */
let wheels = new Array();
/** @type {Wheel|null} The wheel that is currently being edited. */
let editingWheel = null;





/* ---------------- Wheel Entries ---------------- */

/**
 * Adds the given wheel entry (to the primary wheel by default (index 0))
 * @param {WheelEntry} wheelEntry The data to add as a wheel entry
 * @param {Wheel|null} wheel The wheel to add the entry to
 */
function addWheelEntry(wheelEntry=new WheelEntry("", 1, new Array()), wheel=null) {
    if (wheel == null && editingWheel != null) {
        editingWheel.addEntry(wheelEntry);
    }
    else if (wheel != null) {
        wheel.addEntry(wheelEntry);
    }
    rebuildTable();
}


/**
 * Rebuilds the table with all elements present in the editing wheel.
 */
function rebuildTable() {
    // Make sure all things we care about are not null
    if (DOM_ELEMENTS.tableBody == null || editingWheel == null) {
        return;
    }
    // Wipe the table
    DOM_ELEMENTS.tableBody.innerHTML = "";

    editingWheel.getWheelEntries().forEach((wheelEntry, i) => {
        // Make a new row for each wheel entry
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td><input class="textEntry" value="${wheelEntry.getValue()}"></td>
            <td><input class="weightEntry" type="number" min="1" value="${wheelEntry.getWeight()}"></td>
            <td><input class="tagEntry" value="${wheelEntry.getTags()}"></td>
            <td><button class="deleteEntryBtn" data-i="${i}">✕</button></td>
        `;

        const wheelEntryCell = tr.children[0].firstChild;
        const weightCell = tr.children[1].firstChild;
        const tagsCell = tr.children[2].firstChild;
        if (wheelEntryCell == null || !(wheelEntryCell instanceof HTMLInputElement)) { return; }
        if (weightCell == null || !(weightCell instanceof HTMLInputElement)) { return; }
        if (tagsCell == null || !(tagsCell instanceof HTMLInputElement)) { return; }

        // textEntry, weightEntry, tagEntry
        tr.querySelectorAll("input").forEach(inp => {
            inp.oninput = () => {
                // Typescript doesn't understand my genius (because I'm editing DOM using string above...)
                wheelEntry.setValue(wheelEntryCell.value || "");
                wheelEntry.setWeight(Number(weightCell.value) || 1);
                wheelEntry.setTags(tagsCell.value ? tagsCell.value.split(",").map(t => t.trim()) : new Array());

                if (editingWheel != null) { editingWheel.updateEntries(editingWheel.enabledTags); }
                updateTagFilters();
            };
        });

        // Delete button
        // Typescript doesn't understand my genius (because I'm editing DOM using string above...)
        // @ts-ignore
        tr.querySelector("button").onclick = () => {
            if (editingWheel == null) { return; }
            editingWheel.removeEntry(wheelEntry);
            rebuildTable();
        };

        // Whenever <Enter> is pressed, it makes a new element
        wheelEntryCell.addEventListener("keydown", e => {
            // Typescript why
            if (!(e instanceof KeyboardEvent)) { return; }
            if (e.key === "Enter") {
                e.preventDefault();
                const newWheelEntry = addWheelEntry();

                if (DOM_ELEMENTS.tableBody == null || 
                    DOM_ELEMENTS.tableBody.lastChild == null ||
                    !(DOM_ELEMENTS.tableBody.lastChild instanceof HTMLElement))
                {
                    return;
                }
                DOM_ELEMENTS.tableBody.lastChild.focus();
            }
        });

        // Multiline pasting
        wheelEntryCell.addEventListener("paste", e => {
            if (!(e instanceof ClipboardEvent)) { return; }
            if (e.clipboardData == null) { return; }

            const text = e.clipboardData.getData("text");
            // only special-handle multiline paste
            if (!text.includes("\n")) return;

            e.preventDefault();

            const lines = text
                .split(/\r?\n/)
                .map(l => l.trim())
                .filter(Boolean);

            if (!lines.length) return;

            // replace current row text
            wheelEntry.setValue(lines[0]);
            wheelEntryCell.value = lines[0];

            // insert remaining as new entries
            const insertIndex = i + 1;

            const newOnes = lines.slice(1).map(line => {
                const newWheelEntry = WheelEntry.fromText(line);
                if (newWheelEntry != null) { if (editingWheel != null) editingWheel.addEntry(newWheelEntry); }
            });

            rebuildTable();
        });

        // Sometimes typescript hates me
        if (DOM_ELEMENTS.tableBody == null) { return; }
        DOM_ELEMENTS.tableBody.appendChild(tr);
    });

    updateTagFilters();
    updateWheelEntriesCount();
    saveState();

    makeTableDraggable();
}


/***
 * Populates the textModeArea with all editing wheel entries
 */
function populateTextModeArea() {
    if (editingWheel == null || DOM_ELEMENTS.textModeArea == null) { return; }
    if (!(DOM_ELEMENTS.textModeArea instanceof HTMLTextAreaElement)) { return; }
    const lines = editingWheel.getWheelEntries().map(wheelEntry => {
        return wheelEntry.toText();
    });
    DOM_ELEMENTS.textModeArea.value = lines.join("\n");
}

/**
 * This overwrites all existing wheel entries with the text area entries.
 */
function convertTextModeAreaToWheelEntries() {
    if (DOM_ELEMENTS.textModeArea == null || !(DOM_ELEMENTS.textModeArea instanceof HTMLTextAreaElement)) { return; }
    if (editingWheel == null) { return null; }
    const lines = DOM_ELEMENTS.textModeArea.value.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const newEntries = lines.map(line => {
        const parts = line.split("|").map(p => p.trim());
        return new WheelEntry(
            parts.length >= 1 ? parts[0] : "",
            parts.length >= 2 ? Number(parts[1]) || 1 : 1,
            parts.length >= 3 ? parts[2].split(",") : new Array()
        );
    });
    editingWheel.setEntries(newEntries);
    rebuildTable();
    saveState();
}


/**
 * Makes all elements in the wheel entries table draggable.
 */
function makeTableDraggable() {
    /** @type {null|number} */
    let draggedIndex = null;

    if (DOM_ELEMENTS.tableBody == null) { return; }
    DOM_ELEMENTS.tableBody.querySelectorAll("tr").forEach((tr, i) => {
        tr.draggable = true;

        tr.addEventListener("dragstart", e => {
            draggedIndex = i;
            tr.style.opacity = "0.5";
        });

        tr.addEventListener("dragend", e => {
            draggedIndex = null;
            tr.style.opacity = "1";
        });

        tr.addEventListener("dragover", e => {
            e.preventDefault(); // allow drop
            tr.style.borderTop = "2px solid #4CAF50";
        });

        tr.addEventListener("dragleave", e => {
            tr.style.borderTop = "";
        });

        tr.addEventListener("drop", e => {
            e.preventDefault();
            tr.style.borderTop = "";

            if (draggedIndex === null || draggedIndex === i || editingWheel == null) return;

            editingWheel.moveWheelEntry(draggedIndex, i);

            rebuildTable();
        });
    });
}


/**
 * Updates the counts at the top of the entry table
 */
function updateWheelEntriesCount() {
    if (editingWheel == null || DOM_ELEMENTS.wheelEntriesCountSpan == null) { return; }
    const totalWheelEntries = editingWheel.enabledWheelEntries.length;
    const totalWeight = editingWheel.totalWeight;
    DOM_ELEMENTS.wheelEntriesCountSpan.textContent = `${totalWheelEntries}, ${totalWeight}`;
    saveState();
}

/* ---------------- Tags ---------------- */

/**
 * This updates the tags of the currently editing wheel
 */
function updateTagFilters() {
    if (editingWheel == null || DOM_ELEMENTS.tagFiltersDiv == null) { return null; }
    editingWheel.updateTags();

    DOM_ELEMENTS.tagFiltersDiv.innerHTML = "";

    editingWheel.tags.forEach(tag => {
        if (editingWheel == null) { return; }
        const div = document.createElement("div");
        div.className = "tagToggle";

        if (editingWheel.enabledTags.has(tag)) {
            div.classList.add("active");
        }

        div.textContent = tag;

        div.onclick = () => {
            if (editingWheel == null) { return; }
            div.classList.toggle("active");
            editingWheel.toggleTag(div.textContent);
            updateWheelEntriesCount();
        };

        if (DOM_ELEMENTS.tagFiltersDiv == null) { return; }
        DOM_ELEMENTS.tagFiltersDiv.appendChild(div);
    });

    editingWheel.updateEntries(editingWheel.enabledTags);
    saveState();
}


/**
 * Spins all necessary wheels
 */
function spin() {
    clearSubWheels();
    if (editingWheel == null) { return; }
    editingWheel.spin(Date.now());
}


/* ---------------- Drawing ---------------- */

/**
 * Draws all of the wheels
 */
function update() {
    const startTime = performance.now();

    // TODO: Make this use requestAnimationFrame()
    let doneSpinning = true;
    for (const wheel of wheels) {
        wheel.update(Date.now());
        doneSpinning = doneSpinning && wheel.isDoneSpinning();
    }
    if (doneSpinning) {
        // Now gotta check for subwheels
        let needsSubSpin = false;
        for (const wheel of wheels) {
            if (wheel.requiresSubSpins()) {
                needsSubSpin = true;
                for (const subWheel of Object.values(wheel.subWheels)) {
                    wheels.push(subWheel);
                }
                wheel.setNeedsSubSpins(false)
            }
        }
        if (needsSubSpin) {
            restructureWheels();
            for (const wheel of wheels) {
                if (!wheel.hasResult) { wheel.spin(Date.now()); }
            }
        }
        else {
            showWinner()
            for (const wheel of wheels) {
                wheel.resultHandled();
            }
        }
    }

    if (DOM_ELEMENTS.fpsCounter != null) {
        DOM_ELEMENTS.fpsCounter.textContent = String(Math.min(1000, Math.round(1000.0 / (performance.now() - startTime))));
    }
}


/**
 * Brings up the winning entry card for the primary wheel
 */
function showWinner() {
    if (DOM_ELEMENTS.winnerText == null || DOM_ELEMENTS.modal == null || editingWheel == null) { return; }
    const winningWheelText = editingWheel.getWinningWheelText();
    DOM_ELEMENTS.winnerText.textContent = winningWheelText || "";
    DOM_ELEMENTS.modal.classList.remove("hidden");
}


/* ------------- Utilities ------------- */
const cardContainer = document.getElementById("cardContainer");

/**
 * Makes a "toast" card at the top of the screen showing msg for a short duration
 * @param {string} msg The message to be displayed 
 * @param {number} seconds The lifespan of the card in seconds (default is 3)
 */
function showCard(msg, seconds = 3) {
    if (cardContainer == null) { return; }
    const card = document.createElement("div");
    card.className = "toastCard";
    card.textContent = msg;

    const bar = document.createElement("div");
    bar.className = "toastBar";

    card.appendChild(bar);
    cardContainer.appendChild(card);

    bar.animate(
        [{ width: "100%" }, { width: "0%" }],
        { duration: seconds * 1000, easing: "linear" }
    );

    setTimeout(() => {
        card.remove();
    }, seconds * 1000);
}


/* ----------------- Sub Wheels ---------------- */

/**
 * Restructures all wheels in a branch structure.
 */
function restructureWheels() {
    if (DOM_ELEMENTS.wheelWrapper == null) { return; }
    // Format is...
    // each wheel has height of (MAX_VERT_SPACE / SUB_LEVELS)
    // each wheel has width to fit all wheels of that sub level in a line
    // Is this really slow and awful? Yes. But- it's funny.
    let subLevels = 0;
    for (const wheel of wheels) {
        if (wheel.subLevel > subLevels) {
            subLevels = wheel.subLevel;
        }
    }

    const maxHeight = DOM_ELEMENTS.wheelWrapper.clientHeight;
    const wheelHeight = maxHeight / (subLevels+1);

    // Settings button (always there)
    let html = `<button id="settingsBtn" class="settings-btn">⚙</button>\n`;
    html += `<canvas id="wheel-connections" width="650" height="650"></canvas>\n`;
    // Build canvases row-by-row
    let i = 0;
    for (let level = 0; level <= subLevels; level++) {
        // html += `<div class="wheel-row" style="height=${wheelHeight};left=0;top=${wheelHeight*level};">\n`;
        html += `<div class="wheel-row" style="height=${wheelHeight};">\n`;
        for (const wheel of wheels) {
            if (wheel.subLevel != level) {
                continue;
            }
            // We now know that the sublevel is correct
            // TODO: Fix this for large recursions
            const canvasID = "wheel_" + i;
            wheel.setCanvasID(canvasID);
            html += `<canvas id="${canvasID}" class="wheel-canvas" height="${wheelHeight}" width="${wheelHeight}"></canvas>\n`;
            i++;
        }
        html += `</div>`;
    }
    DOM_ELEMENTS.wheelWrapper.innerHTML = html;

    // Now we gotta go set all the canvases
    setTimeout(() => {
        for (const wheel of wheels) {
            wheel.setCanvasFromID();
            wheel.drawSegments();
        }
        // Next up, draw a bunch of lines between them all
        const wheelConnections = document.getElementById("wheel-connections");
        if (wheelConnections == null || !(wheelConnections instanceof HTMLCanvasElement)) { return; }
        const connectionsContext = wheelConnections.getContext("2d");
        if (connectionsContext == null || !(connectionsContext instanceof CanvasRenderingContext2D)) { return; }
        const ox = wheelConnections.getBoundingClientRect().left;
        const oy = wheelConnections.getBoundingClientRect().top;
        let parentRect, px, py;
        let childRect, cx, cy;
        connectionsContext.clearRect(0, 0, wheelConnections.width, wheelConnections.height);
        for (const wheel of wheels) {
            if (wheel.canvas == null) { continue; }
            parentRect = wheel.canvas.getBoundingClientRect();
            px = parentRect.left + parentRect.width * 0.5;
            py = parentRect.top + parentRect.height * 0.975;
            for (const subWheel of Object.values(wheel.subWheels)) {
                if (subWheel.canvas == null) { continue; }
                childRect = subWheel.canvas.getBoundingClientRect();
                cx = childRect.left + childRect.width * 0.5;
                cy = childRect.top + childRect.height * 0.025;
                connectionsContext.save();
                connectionsContext.beginPath();
                console.log(`Drawn line from (${px - ox}, ${py - oy}) to (${cx - ox}, ${cy - oy})`)
                connectionsContext.moveTo(px - ox, py - oy);
                connectionsContext.moveTo(cx - ox, cy - oy);
                connectionsContext.lineWidth = 3;
                connectionsContext.strokeStyle = "red";
                connectionsContext.stroke();
                connectionsContext.restore();
            }
        }
    }, 10);
    
}


/**
 * Removes all sub wheels and fixes the size
 */
function clearSubWheels() {
    if (wheels.length == 1) {
        return;
    }

    for (let i = 0; i < wheels.length; i++) {
        if (wheels[i].isSubwheel()) {
            // Remove wheel if it's a subwheel
            wheels.splice(i, 1);
            i--;
        }
        else {
            wheels[i].subWheels = {};
        }
    }

    restructureWheels();
}


/* ---------------- Persistence ---------------- */

/**
 * All the saved wheels in local cache
 * @returns {Record<string, import("./wheel.js").SavedWheel>} All the saved wheels in the local cache
 */
function getSavedWheels() {
    return JSON.parse(localStorage.getItem("savedWheels") || "{}");
}


/**
 * Sets the saved wheels in local cache to the provided JSON
 * @param {Object} json The JSON of all saved wheels
 */
function setSavedWheels(json) {
    localStorage.setItem("savedWheels", JSON.stringify(json));
}

/**
 * Saves the current wheel to local cache
 */
function saveState() {
    if (editingWheel == null) { return; }
    localStorage.setItem(
        "wheelState",
        JSON.stringify(editingWheel.toJSON())
    );
}

/**
 * Clears the cache. Used only for debugging.
 */
function clearCache() {
    localStorage.setItem("wheelState", "");
}

/**
 * Loads the most recently used wheel
 */
function loadState() {
    const saved = localStorage.getItem("wheelState");
    if (saved && saved != "") {
        loadWheelData(JSON.parse(saved));
    }
}

/**
 * Loads the given JSON data into the currently editable wheel
 * @param {import("./wheel.js").SavedWheel} json The data to load (typically gotten from Wheel.toJSON)
 */
function loadWheelData(json) {
    clearSubWheels();
    if (editingWheel == null) {
        editingWheel = Wheel.fromJSON(json);
    }
    else {
        editingWheel.fromJSON(json)
    }
    if (DOM_ELEMENTS.canvas != null && DOM_ELEMENTS.canvas instanceof HTMLCanvasElement)
        editingWheel.setCanvas(DOM_ELEMENTS.canvas);
    rebuildTable();
}


/* ---------------- Init/Main ---------------- */
document.addEventListener("DOMContentLoaded", () => {
    editingWheel = Wheel.baseWheel();
    wheels.push(editingWheel)
    // Attempt to load wheel from cache
    loadState();
    initializeDOMStuff(editingWheel, saveState, spin);

    // Toggle Text Mode
    if (DOM_ELEMENTS.textModeSwitch != null)
    DOM_ELEMENTS.textModeSwitch.onchange = () => {
        if (DOM_ELEMENTS.textModeSwitch == null ||
            !(DOM_ELEMENTS.textModeSwitch instanceof HTMLInputElement) ||
            DOM_ELEMENTS.tableBody == null ||
            DOM_ELEMENTS.tableBody.parentElement == null ||
            DOM_ELEMENTS.textModeArea == null
        ) { return; }
        textModeActive = DOM_ELEMENTS.textModeSwitch.checked;

        if (textModeActive) {
            DOM_ELEMENTS.tableBody.parentElement.classList.add("hidden"); // hide table container
            DOM_ELEMENTS.textModeArea.classList.remove("hidden");
            populateTextModeArea();
        } else {
            DOM_ELEMENTS.tableBody.parentElement.classList.remove("hidden");
            DOM_ELEMENTS.textModeArea.classList.add("hidden");
            convertTextModeAreaToWheelEntries(); // sync back into table
        }
    };

    // Autosave while typing
    if (DOM_ELEMENTS.textModeArea != null)
    DOM_ELEMENTS.textModeArea.addEventListener("input", () => {
        convertTextModeAreaToWheelEntries();
    });

    // Shuffle button
    if (DOM_ELEMENTS.shuffleBtn != null)
    DOM_ELEMENTS.shuffleBtn.onclick = () => {
        if (editingWheel == null) { return; }
        editingWheel.shuffleEntries();
        rebuildTable();
        showCard("Shuffled!", 1);
    };

    setInterval(update, 10);
});