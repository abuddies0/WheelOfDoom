 // @ts-check

 const DOM_ELEMENTS = {
     canvas: document.getElementById("main-wheel-canvas"),
     wheelWrapper: document.getElementById("wheel-wrapper"),

    // Wheel Entries
     tableBody: document.querySelector("#wheel-entry-table tbody"),
     tagFiltersDiv: document.getElementById("tag-filters"),
     textModeSwitch: document.getElementById("text-mode-switch"),
     textModeArea: document.getElementById("text-mode-area"),
     textModeInput: document.getElementById("text-mode-area-input"),
     textModeVisible: document.getElementById("text-mode-area-visible"),
     shuffleButton: document.getElementById("shuffle-button"),
     wheelEntriesCountSpan: document.getElementById("wheel-entries-count"),
     wheelEntriesWeightSpan: document.getElementById("wheel-entries-weight"),

    // General toolbar buttons
     newWheelButton: document.getElementById("new-wheel-button"),
     saveWheelButton: document.getElementById("save-wheel-button"),
     saveAsWheelButton: document.getElementById("save-as-wheel-button"),
     copyButton: document.getElementById("copy-button"),
     importFile: document.getElementById("import-file"),
     importButton: document.getElementById("import-button"),
     exportButton: document.getElementById("export-button"),
     spinButton: document.getElementById("spin-button"),

    // Modals
     modal: document.getElementById("winner-modal"),
     winnerText: document.getElementById("winner-text"),
     closeModalButton: document.getElementById("close-modal-button"),

     settingsButton: document.getElementById("settings-button"),
     settingsModal: document.getElementById("settings-modal"),
     closeSettingsButton: document.getElementById("close-settings-button"),

     confirmSaveAsButton: document.getElementById("confirm-save-as-button"),
     cancelSaveAsButton: document.getElementById("cancel-save-as-button"),
     saveModal: document.getElementById("save-modal"),
     saveNameInput: document.getElementById("save-name-input"),

     helpModal: document.getElementById("help-modal"),
     openHelpButton: document.getElementById("help-button"),
     closeHelpButton: document.getElementById("close-help-button"),

    // Wheel Settings
     spinStrengthSlider: document.getElementById("spin-strength-slider"),
     spinStrengthNumber: document.getElementById("spin-strength-number"),
     spinDurationSlider: document.getElementById("spin-duration-slider"),
     spinDurationNumber: document.getElementById("spin-duration-number"),
     colorSchemeSelect: document.getElementById("color-scheme-select"),
     spinSoundSelect: document.getElementById("spin-sound-select"),
     winSoundSelect: document.getElementById("win-sound-select"),

     // Wheel Select & Wheel Select Menu
     wheelSelectBrowser: document.getElementById("wheel-select-browser"),
     wheelSelectWheelMenu: document.getElementById("wheel-select-wheel-menu"),
     wheelSelectWheelMenuDelete: document.getElementById("wheel-select-wheel-menu-delete"),

     // Debug Stuff
     fpsCounter: document.getElementById("fps")
};


/** @type {Array<string>} The names of every wheel being selected in the browser */
let selectedWheels = new Array();

/** @type {number|null} The last selected wheel select element (index) */
let lastSelectedIndex = null;





/**
 * Imports the given wheel
 * @param {Event} e The event given from opening a file browser
 */
function importWheel(e) {
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
}


/**
 * Exports the wheel as a file
 */
function exportWheel() {
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
}


/**
 * Opens up the Save As modal
 */
function openSaveAsModal() {
    // Opens up the dialogue
    if (DOM_ELEMENTS.saveNameInput == null ||
        DOM_ELEMENTS.saveModal == null ||
        DOM_ELEMENTS.saveNameInput == null ||
        !(DOM_ELEMENTS.saveNameInput instanceof HTMLInputElement) ||
        editingWheel == null
    ) { return; }
    DOM_ELEMENTS.saveNameInput.value = editingWheel.getName();
    showModal(DOM_ELEMENTS.saveModal);
    DOM_ELEMENTS.saveNameInput.focus();

    /**
     * @param {Event} e The keyboard event
     */
    let enterSpeedUp = (e) => {
        if (e instanceof KeyboardEvent && e.key === "Enter") {
            saveAs();
            if (DOM_ELEMENTS.saveNameInput != null && DOM_ELEMENTS.saveNameInput instanceof HTMLElement)
            DOM_ELEMENTS.saveNameInput.removeEventListener("keypress", enterSpeedUp);
        }
    }
    DOM_ELEMENTS.saveNameInput.addEventListener("keypress", enterSpeedUp);

    // Makes sure the wheel is cached properly
    saveState();
}


/**
 * Opens up the save modal to save the current wheel.
 */
function saveAs() {
    if (DOM_ELEMENTS.saveNameInput == null || 
        !(DOM_ELEMENTS.saveNameInput instanceof HTMLInputElement) ||
        editingWheel == null ||
        DOM_ELEMENTS.saveModal == null
    ) { return; }
    const name = DOM_ELEMENTS.saveNameInput.value.trim();
    if (!name) return;

    const wheels = getSavedWheels();

    const wheelJSON = editingWheel.toJSON();
    wheelJSON['name'] = name;
    wheels[name] = wheelJSON;

    editingWheel.setName(name);
    setSavedWheels(wheels);

    DOM_ELEMENTS.saveModal.classList.add("hidden");
    showCard(`Saved '${name}' Successfully!`, 4);
}


function save() {
    if (editingWheel == null) { return null; }
    if (editingWheel.getName() == null || editingWheel.getName() == "") {
        openSaveAsModal();
        return;
    }

    const wheels = getSavedWheels();
    wheels[editingWheel.getName()] = editingWheel.toJSON();

    showCard(`Saved '${editingWheel.getName()}'`, 2)

    setSavedWheels(wheels);
}


/**
 * Copies the wheel being edited to the clipboard
 */
function copyWheelJSON() {
    if (editingWheel == null) { return; }
    navigator.clipboard.writeText(JSON.stringify(editingWheel.toJSON()));
    showCard("Copied JSON", 2);
}


/**
 * Opens up the wheel settings
 */
function openWheelSettings() {
    if (editingWheel == null) { return; }

    if (DOM_ELEMENTS.settingsModal != null)
        showModal(DOM_ELEMENTS.settingsModal);

    if (DOM_ELEMENTS.spinStrengthSlider != null && DOM_ELEMENTS.spinStrengthSlider instanceof HTMLInputElement)
        DOM_ELEMENTS.spinStrengthSlider.value = String(editingWheel.spinStrength);
    if (DOM_ELEMENTS.spinStrengthNumber != null && DOM_ELEMENTS.spinStrengthNumber instanceof HTMLInputElement)
        DOM_ELEMENTS.spinStrengthNumber.value = String(editingWheel.spinStrength);

    if (DOM_ELEMENTS.spinDurationSlider != null && DOM_ELEMENTS.spinDurationSlider instanceof HTMLInputElement)
        DOM_ELEMENTS.spinDurationSlider.value = String(editingWheel.spinDuration * 0.001);
    if (DOM_ELEMENTS.spinDurationNumber != null && DOM_ELEMENTS.spinDurationNumber instanceof HTMLInputElement)
        DOM_ELEMENTS.spinDurationNumber.value = String(editingWheel.spinDuration * 0.001);

    if (DOM_ELEMENTS.colorSchemeSelect != null && DOM_ELEMENTS.colorSchemeSelect instanceof HTMLInputElement)
        DOM_ELEMENTS.colorSchemeSelect.value = Wheel.getColorSchemeFromFunction(editingWheel.colorScheme) || "";
    if (DOM_ELEMENTS.spinSoundSelect != null && DOM_ELEMENTS.spinSoundSelect instanceof HTMLInputElement)
        DOM_ELEMENTS.spinSoundSelect.value = Wheel.getSpinSoundFromAudio(editingWheel.spinSound) || "";
    if (DOM_ELEMENTS.winSoundSelect != null && DOM_ELEMENTS.winSoundSelect instanceof HTMLInputElement)
        DOM_ELEMENTS.winSoundSelect.value = Wheel.getWinSoundFromAudio(editingWheel.winSound) || "";
}


/** 
 * Syncs the spin duration setting of the current wheel based on the slider
 * @param {number} value The value to set the spin duration to (in seconds)
 */
function syncSpinDuration(value) {
    if (editingWheel == null) { return; }
    editingWheel.spinDuration = value*1000;
    if (DOM_ELEMENTS.spinDurationSlider != null && DOM_ELEMENTS.spinDurationSlider instanceof HTMLInputElement)
        DOM_ELEMENTS.spinDurationSlider.value = String(value);
    if (DOM_ELEMENTS.spinDurationNumber != null && DOM_ELEMENTS.spinDurationNumber instanceof HTMLInputElement)
        DOM_ELEMENTS.spinDurationNumber.value = String(value);
    saveState();
}


/** 
 * Syncs the spin strength setting of the current wheel based on the slider
 * @param {number} value The value to set the spin strength to
 */
function syncSpinStrength(value) {
    if (editingWheel == null) { return; }
    editingWheel.spinStrength = value;
    if (DOM_ELEMENTS.spinStrengthSlider != null && DOM_ELEMENTS.spinStrengthSlider instanceof HTMLInputElement)
        DOM_ELEMENTS.spinStrengthSlider.value = String(value);
    if (DOM_ELEMENTS.spinStrengthNumber != null && DOM_ELEMENTS.spinStrengthNumber instanceof HTMLInputElement)
        DOM_ELEMENTS.spinStrengthNumber.value = String(value);
    saveState();
}


/**
 * Sets the color scheme of the current wheel
 * @param {string} colorScheme The color scheme to set the editing wheel to
 */
function setColorScheme(colorScheme) {
    if (editingWheel == null) { return; }
    console.log(colorScheme.toLowerCase().replaceAll(" ", ""));
    editingWheel.setColorScheme(Wheel.COLOR_SCHEMES[colorScheme]);
    editingWheel.makeBuffer(true);
    saveState();
}


/**
 * Sets the spin sound of the current wheel
 * @param {string} spinSound The key of the spin sound in Wheel.SPIN_SOUNDS
 */
function setSpinSound(spinSound) {
    if (editingWheel == null) { return; }
    editingWheel.setSpinSound(Wheel.SPIN_SOUNDS[spinSound]);
    saveState();
}


/**
 * Sets the win sound of the current wheel
 * @param {string} winSound The key of the win sound in Wheel.WIN_SOUNDS
 */
function setWinSound(winSound) {
    if (editingWheel == null) { return; }
    editingWheel.setWinSound(Wheel.WIN_SOUNDS[winSound]);
    saveState();
}


/**
 * Makes the given modal appear
 * @param {HTMLElement|null} modal The modal to make appear
 */
function showModal(modal) {
    if (modal == null) { return; }
    modal.classList.remove("hidden");

    /** @param {Event} e The event that closed the modal */
    let closeModal = (e) => {
        if (e instanceof KeyboardEvent && e.key == "Escape") {
            modal.classList.add("hidden");
            removeEventListener("click", closeModal);
            removeEventListener("keydown", closeModal);
        }
        if (e instanceof MouseEvent && e.target === modal) {
            modal.classList.add("hidden");
            removeEventListener("click", closeModal);
            removeEventListener("keydown", closeModal);
        }
    }

    modal.addEventListener("click", closeModal);
    document.addEventListener("keydown", closeModal);
}


/**
 * Opens up the wheel select menu
 * @param {Event} e The event that called this open
 */
function openWheelSelectMenu(e) {
    if (DOM_ELEMENTS.wheelSelectWheelMenu == null || !(DOM_ELEMENTS.wheelSelectWheelMenu instanceof HTMLElement)) { return; }
    e.preventDefault();

    if (!(e instanceof PointerEvent)) { return; }
    // Get mouse coordinates
    const { clientX: mouseX, clientY: mouseY } = e;

    // Position and show menu
    DOM_ELEMENTS.wheelSelectWheelMenu.style.top = `${mouseY}px`;
    DOM_ELEMENTS.wheelSelectWheelMenu.style.left = `${mouseX}px`;
    DOM_ELEMENTS.wheelSelectWheelMenu.classList.remove('hidden');
    if (!(e.target instanceof HTMLElement)) { return; }
    const selectedJSON = getSavedWheels()[e.target.textContent];
    if (selectedJSON != undefined) {
        selectedWheels.push(selectedJSON.name);
        
    }
    else {
        lastSelectedIndex = null;
        selectedWheels = new Array();
    }   
}


/**
 * Opens up the help modal
 */
function openHelpModal() {
    if (DOM_ELEMENTS.helpModal == null || !(DOM_ELEMENTS.helpModal instanceof HTMLElement)) { return; }
    showModal(DOM_ELEMENTS.helpModal);
}


/**
 * Deletes the selected wheel (if it exists)
 * @param {Event} e The event of pressing the button
 */
function deleteSelectedWheels(e) {
    for (const wheel of selectedWheels) {
        deleteWheel(wheel);
    }
    lastSelectedIndex = null;
}


/**
 * Gets all the selectable wheels in the HTML DOM
 * @returns {Array<HTMLElement>} A list of all selectable wheel HTML entries
 */
function getAllSelectableWheels() {
    return Array.from(document.querySelectorAll(".wheel-select-wheel"));
}


/**
 * Clears the last wheel selection
 */
function clearSelection() {
    document.querySelectorAll(".wheel-select-wheel.selected")
        .forEach(el => el.classList.remove("selected"));
}


/**
 * Handles selecting a single wheel
 * @param {HTMLElement} item The wheel that is selected
 */
function handleSingleSelect(item) {
    clearSelection();
    item.classList.add("selected");
}


/**
 * Toggles the given item as selected
 * @param {HTMLElement} item The wheel to be selected/unselected
 */
function handleCtrlSelect(item) {
    item.classList.toggle("selected");
}


/**
 * Toggles the given item as selected
 * @param {Array<HTMLElement>} selectableWheels All the wheels in the wheel browser
 * @param {number} currentIndex The starting index of the shift select
 */
function handleShiftSelect(selectableWheels, currentIndex) {
    if (lastSelectedIndex == null) return;
    if (currentIndex < 0) return;
    if (lastSelectedIndex < 0) return;

    clearSelection();

    const start = Math.min(lastSelectedIndex, currentIndex);
    const end = Math.max(lastSelectedIndex, currentIndex);

    for (let i = start; i <= end; i++) {
        const el = selectableWheels[i];
        if (!el) continue;
        el.classList.add("selected");
    }
}


/**
 * Updates the global list of selected wheels from the DOM
 */
function updateSelectedWheels() {
    selectedWheels = Array.from(
        document.querySelectorAll(".wheel-select-wheel.selected")
    ).map(el => el.textContent.trim());
}


/**
 * Initializes all the DOM stuff given the primary wheel
 * @param {() => void} spin Call this to spin the wheel.
 */
function initializeDOMStuff(spin) {
    // General Modal
    if (DOM_ELEMENTS.closeModalButton != null) {
        DOM_ELEMENTS.closeModalButton.onclick = () => {
            if (DOM_ELEMENTS.modal == null) { return; }
            DOM_ELEMENTS.modal.classList.add("hidden");
        };
    }

    // Help
    if (DOM_ELEMENTS.openHelpButton != null) {
        DOM_ELEMENTS.openHelpButton.onclick = () => {
            openHelpModal();
        };
    }

    if (DOM_ELEMENTS.closeHelpButton != null) {
        DOM_ELEMENTS.closeHelpButton.onclick = () => {
            if (DOM_ELEMENTS.helpModal == null) { return null; }
            DOM_ELEMENTS.helpModal.classList.add("hidden");
        };
    }

    // Settings
    if (DOM_ELEMENTS.settingsButton != null) {
        DOM_ELEMENTS.settingsButton.onclick = () => {
            openWheelSettings();
        };
    }

    if (DOM_ELEMENTS.closeSettingsButton != null) {
        DOM_ELEMENTS.closeSettingsButton.onclick = () => {
            if (DOM_ELEMENTS.settingsModal == null) { return null; }
            DOM_ELEMENTS.settingsModal.classList.add("hidden");
        };
    }

    // Spin the wheel
    if (DOM_ELEMENTS.wheelWrapper != null) {
        DOM_ELEMENTS.wheelWrapper.onclick = () => { spin(); };
    }
    if (DOM_ELEMENTS.spinButton != null) {
        DOM_ELEMENTS.spinButton.onclick = () => { spin(); };
    }

    // Import / Export
    if (DOM_ELEMENTS.exportButton != null) {
        DOM_ELEMENTS.exportButton.onclick = () => {
            exportWheel();
        };
    }
    
    if (DOM_ELEMENTS.importButton != null) {
        DOM_ELEMENTS.importButton.onclick = () => { if (DOM_ELEMENTS.importFile != null) DOM_ELEMENTS.importFile.click() };
    }
    
    if (DOM_ELEMENTS.importFile != null) {
        DOM_ELEMENTS.importFile.onchange = e => {
            importWheel(e);
        };
    }

    // Copy
    if (DOM_ELEMENTS.copyButton != null) {
        DOM_ELEMENTS.copyButton.onclick = () => {
            copyWheelJSON();
        };
    }
    
    // Saving / Loading
    if (DOM_ELEMENTS.cancelSaveAsButton != null) {
        DOM_ELEMENTS.cancelSaveAsButton.onclick = () => {
            if (DOM_ELEMENTS.saveModal != null) { 
                DOM_ELEMENTS.saveModal.classList.add("hidden");
            }
        }
    }

    if (DOM_ELEMENTS.saveAsWheelButton != null) {
        DOM_ELEMENTS.saveAsWheelButton.onclick = () => {
            openSaveAsModal();
        };
    }

    if (DOM_ELEMENTS.confirmSaveAsButton != null) {
        DOM_ELEMENTS.confirmSaveAsButton.onclick = () => {
            saveAs();
        };
    }

    if (DOM_ELEMENTS.newWheelButton != null) {
        DOM_ELEMENTS.newWheelButton.onclick = () => {
            loadWheelData(Wheel.baseWheel().toJSON()); 
            showCard("Made New Wheel!", 2);
            saveState();
        }
    }

    if (DOM_ELEMENTS.saveWheelButton != null) {
        DOM_ELEMENTS.saveWheelButton.onclick = () => {
            save();
        };
    }

    /* ------------ WHEEL SETTINGS ------------ */
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
    
    if (DOM_ELEMENTS.spinDurationSlider != null) {
        DOM_ELEMENTS.spinDurationSlider.oninput = e => {
            if (e.target != null && e.target instanceof HTMLInputElement) {
                syncSpinDuration(Number(e.target.value));
            }
        };
    }

    if (DOM_ELEMENTS.spinDurationNumber != null) {
        DOM_ELEMENTS.spinDurationNumber.oninput = e => {
            if (e.target != null && e.target instanceof HTMLInputElement) {
                syncSpinDuration(Number(e.target.value));
            }
        };
    }

    if (DOM_ELEMENTS.colorSchemeSelect != null) {
        DOM_ELEMENTS.colorSchemeSelect.oninput = e => {
            // @ts-ignore
            setColorScheme(e.target.value);
        };
    }

    if (DOM_ELEMENTS.spinSoundSelect != null) {
        DOM_ELEMENTS.spinSoundSelect.oninput = e => {
            // @ts-ignore
            setSpinSound(e.target.value);
        };
    }

    if (DOM_ELEMENTS.winSoundSelect != null) {
        DOM_ELEMENTS.winSoundSelect.oninput = e => {
            // @ts-ignore
            setWinSound(e.target.value);
        };
    }

    // Temporary canvas (will be deleted by restructureWheels())
    if (editingWheel != null && DOM_ELEMENTS.canvas != null && DOM_ELEMENTS.canvas instanceof HTMLCanvasElement) {
        editingWheel.setCanvas(DOM_ELEMENTS.canvas);
    }

    // Wheel Select Stuff
    // if (DOM_ELEMENTS.wheelSelectBrowser != null && DOM_ELEMENTS.wheelSelectBrowser instanceof HTMLElement) {
    //     DOM_ELEMENTS.wheelSelectBrowser.addEventListener('contextmenu', openWheelSelectMenu);
    // }

    if (DOM_ELEMENTS.wheelSelectBrowser != null && DOM_ELEMENTS.wheelSelectBrowser instanceof HTMLElement) {
        DOM_ELEMENTS.wheelSelectBrowser.addEventListener("click", (e) => {
            if (!(e instanceof MouseEvent) || e.target == null || !(e.target instanceof HTMLElement)) { return; }
            if (e.target == DOM_ELEMENTS.wheelSelectBrowser) {
                clearSelection();
                return;
            }
            const item = e.target.closest(".wheel-select-wheel");
            if (item == null || !(item instanceof HTMLElement)) return;

            const selectableWheels = getAllSelectableWheels();
            const index = selectableWheels.indexOf(item);

            if (e.shiftKey) {
                e.preventDefault();
                if (lastSelectedIndex == null) {
                    handleSingleSelect(item);
                    lastSelectedIndex = index;
                }
                else {
                    handleShiftSelect(selectableWheels, index);
                }
            } else if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                handleCtrlSelect(item);
                lastSelectedIndex = index;
            } else {
                handleSingleSelect(item);
                lastSelectedIndex = index;
            }

            updateSelectedWheels();
        });
    }

    document.addEventListener('click', () => {
        if (DOM_ELEMENTS.wheelSelectWheelMenu != null && DOM_ELEMENTS.wheelSelectWheelMenu instanceof HTMLElement) {
            DOM_ELEMENTS.wheelSelectWheelMenu.classList.add('hidden');
        }
    });

    if (DOM_ELEMENTS.wheelSelectWheelMenuDelete != null && DOM_ELEMENTS.wheelSelectWheelMenuDelete instanceof HTMLElement) {
        DOM_ELEMENTS.wheelSelectWheelMenuDelete.addEventListener('click', deleteSelectedWheels);
    }


    // Text Area Coloring
    if (DOM_ELEMENTS.textModeInput != null && DOM_ELEMENTS.textModeVisible != null && DOM_ELEMENTS.textModeArea != null &&
        DOM_ELEMENTS.textModeInput instanceof HTMLTextAreaElement
    ) {
        DOM_ELEMENTS.textModeInput.addEventListener('input', updateTextArea);

        // Optional: sync scroll
        DOM_ELEMENTS.textModeInput.addEventListener('scroll', () => {
            if (DOM_ELEMENTS.textModeVisible == null || DOM_ELEMENTS.textModeInput == null) { return; }
            DOM_ELEMENTS.textModeVisible.scrollTop = DOM_ELEMENTS.textModeInput.scrollTop;
            DOM_ELEMENTS.textModeVisible.scrollLeft = DOM_ELEMENTS.textModeInput.scrollTop;
        });

        // Focus div when user clicks
        DOM_ELEMENTS.textModeVisible.addEventListener('click', () => { if (DOM_ELEMENTS.textModeArea != null) DOM_ELEMENTS.textModeArea.focus() });
    }
}

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
class Wheel {
    /** @type {boolean} True if the static variables are properly initialized */
    static INITIALIZED = false;

    /**
     * @type {WheelSettings} All the default settings
     */
    static DEFAULT_SETTINGS = {
        spinStrength: 12,
        spinDuration: 2000,
        colorScheme: "classic",
        spinSound: "classic",
        winSound: "jonnahwhimsy"
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
        classic: new Audio("asset/sound/spin/classic.mp3"),
        metalpipe: new Audio("asset/sound/spin/metal_pipe.mp3"),
        silence: new Audio("asset/sound/silence.mp3")
    };

    /** @type {Record<string, HTMLAudioElement>} All the sounds that can be used after winning */
    static WIN_SOUNDS = {
        jonnahwhimsy: new Audio("asset/sound/win/jonnah_whimsy.mp3"),
        wow: new Audio("asset/sound/win/wow.mp3"),
        yippee: new Audio("asset/sound/win/yippee.mp3"),
        silence: new Audio("asset/sound/silence.mp3")
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
        /** @type {boolean} True if this entries on this wheel are exclusive (as in they can't be reobtained by other exclusives) */
        this.isExclusive = false;

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
     * @param {boolean} useCache True if the program should first check the cache for wheels matching this name. (default=false)
     * @param {boolean} makeBuffer True if the new wheel should automatically make a cache. (default=true)
     * @return {Wheel} The wheel that contains that json data
     */
    static fromJSON(json, useCache=false, makeBuffer=true) {
        // Check cache first
        if (useCache && Wheel.CACHED_WHEELS.hasOwnProperty(json.name)) {
            const newWheel = Wheel.baseWheel();
            newWheel.fromCache(Wheel.CACHED_WHEELS[json.name]);
            return newWheel;
        }
        // Ignore cache and make new wheel
        const newWheel = Wheel.baseWheel();
        newWheel.fromJSON(json, makeBuffer);
        return newWheel;
    }


    /**
     * Overwrites all the data of this current wheel
     * This copies pretty much everything except the literal canvas
     * @param {Wheel} cachedWheel The cached wheel to overwrite with
     */
    fromCache(cachedWheel) {
        // console.log("Loaded wheel from cache!");

        this.setName(cachedWheel.name);
        this.setEntries(cachedWheel.wheelEntries);
        this.enabledTags = cachedWheel.enabledTags;
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

        this.canvasBuffer = cachedWheel.canvasBuffer;
        this.contextBuffer = cachedWheel.contextBuffer;
    }


    /**
     * Overwrites all the data of this current wheel.
     * @param {SavedWheel} json The json to overwrite the wheel with.
     * @param {boolean} makeBuffer True if the program should automatically make a buffer. (default=true)
     */
    fromJSON(json, makeBuffer=true) {
        this.setName(json.name);
        this.setEntries(json.wheelEntries.map(savedEntry => WheelEntry.fromJSON(savedEntry)).filter(e => e !== null));
        if (json.enabledTags instanceof Array) { this.enabledTags = new Set(json.enabledTags); }
        this.riggedWheelEntry = this.getWheelEntryByValue(json.riggedEntry);
        this.riggedAmount = json.riggedAmount;

        this.updateTags();
        this.updateEntries(this.enabledTags, makeBuffer);

        this.spinStrength = json.settings.spinStrength;
        this.spinDuration = json.settings.spinDuration;
        this.colorScheme = Wheel.COLOR_SCHEMES[json.settings.colorScheme];
        this.spinSound = Wheel.SPIN_SOUNDS[json.settings.spinSound];
        this.winSound = Wheel.WIN_SOUNDS[json.settings.winSound];
    }


    /**
     * This should only be called when the wheel needs to first be drawn.
     * @param {boolean} force Forces the wheel to be redrawn anyway
     */
    makeBuffer(force=false) {
        // Cached wheels cannot be rebuffered
        if (this.isCached) {
            return;
        }
        // console.log(`Buffered wheel named ${this.name} with ${this.wheelEntries.length} entries. :p`);

        this.buffered = true;
        let canvasToUse = null;
        if (this.canvas != null) {
            canvasToUse = this.canvas;
        }
        else if (this.canvasBuffer != null) {
            canvasToUse = this.canvasBuffer;
        }
        else {
            return;
        }
        if (this.contextBuffer == null) return;
        this.canvasBuffer.width = canvasToUse.width;
        this.canvasBuffer.height = canvasToUse.height;
        // Do not render if there are no wheel entries
        if (this.enabledWheelEntries.length == 0) return;
        // Clear the canvas
        this.contextBuffer.clearRect(0, 0, canvasToUse.width, canvasToUse.height);
        // Choose the correct color scheme
        const colorSchemeFunction = this.colorScheme || Wheel.COLOR_SCHEMES.classic;

        // Buffer, center, and rotate the wheel
        // const horOffset = this.canvas.width * 0.025;    // 2.5% padding
        // const verOffset = this.canvas.height* 0.025;    // 2.5% padding
        const radius = canvasToUse.height * 0.475;      // 95% of space is wheel
        this.contextBuffer.save();
        this.contextBuffer.translate(canvasToUse.width*0.5, canvasToUse.height*0.5);   // Center
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

            // Only use lines if the slices will be too small
            if (this.sliceAngles[i] < 0.05) {
                this.contextBuffer.fillStyle = "#111";
                const offset = Math.max(1-text.length*0.025, 0.3) * radius;
                this.contextBuffer.fillRect(offset, 0, radius*0.96-offset, this.sliceAngles[i]*40);
            }
            else {
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
            }
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
        this.context.drawImage(this.canvasBuffer, -radius, -radius, this.canvas.width, this.canvas.height);
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
     * @param {Record<string, Set<string>>} excludedEntries A record of all entries that are impossible to obtain {WHEEL_NAME: [ENTRY_1, ENTRY_2, ...]}
     */
    spin(time, riggedValue=null, excludedEntries={}) {
        console.log("SPIN... THAT... WHEELLLLL!");
        if (this.isSpinning) { return; }
        this.isSpinning = true;
        this.hasResult = false;
        this.spinStartTime = time;
        this.spinEndTime = this.spinStartTime + this.spinDuration;

        // Pull wheel entry and set rotation accordingly
        const pulled = this.pullWeightedWheelEntry(excludedEntries);
        this.winningWheelEntry = pulled["wheelEntry"];
        // Failed to pull
        if (this.winningWheelEntry == null) {
            this.isSpinning = false;
            console.log("Failed to spin because entry pulled is null.");
            return;
        }
        // Add all necessary subwheels
        this.subWheels = {};
        this.addSubWheels(Wheel.findSubWheels(this.winningWheelEntry.value));
        if (Object.keys(this.subWheels).length != 0) { this.needsSubSpin = true; }
        // Setup rotation shenanigans
        this.rotation = this.rotation % (2 * Math.PI);
        this.targetRotation =
            (pulled["weight"] * this.sliceUnitAngle) +
            2*Math.PI * Math.ceil(this.spinStrength);
        if (this.targetRotation < 2*Math.PI) { this.targetRotation += 2*Math.PI; }

        this.spinSound.play();
        this.initialRotation = this.rotation;
        if (this.isExclusive) { addExcludedEntry(this.getName(), this.winningWheelEntry.value); }
    }
    

    /**
     * Forces the wheel to stop spinning.
     * Does not return any results.
     */
    stopSpinning() {
        this.isSpinning = false;
        this.hasResult = false;
        this.spinSound.pause();
        this.winSound.pause();
    }


    /**
     * Finds all subwheels from the given text
     * @param {string} text The text from the entry to scrape the subwheels of
     * @return {Array<string>} An array of all the subwheels without the curly braces
     */
    static findSubWheels(text) {
        let subWheels = new Array();
        let i = 0;
        let inSubWheel = false;
        let currentSubWheel = "";
        let c;
        while (i < text.length) {
            c = text.charAt(i);
            if (inSubWheel) {
                if (c == '\\') {
                    // just skip to the next place
                    i++;
                    currentSubWheel += text.charAt(i);
                }
                else if (c == '}') {
                    inSubWheel = false;
                    subWheels.push(currentSubWheel);
                    currentSubWheel = "";
                }
                else {
                    currentSubWheel += c;
                }
            }
            // Delimiter
            if (c == '\\') {
                // just skip to the next place
                i++;
            }
            else if (c == '{') {
                inSubWheel = true;
            }
            i++;
        }
        
        return subWheels;
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
        let isExclusive = false;

        for (let subName of wheelNames) {
            isExclusive = false;
            // Handle exclusives
            if (subName.length > 0 && subName.charAt(0) == "!") {
                isExclusive = true;
                subName = subName.substring(1, subName.length);
            }
            // Skip if the wheel doesn't exist
            if (!names.includes(subName)) {
                console.log(`Wheel {${subName}} doesn't exist.`)
                continue;
            }
            const subWheel = Wheel.fromJSON(savedWheels[subName], true);
            subWheel.isSub = true;
            subWheel.subLevel = this.subLevel + 1;
            subWheel.parentWheel = this;
            subWheel.isExclusive = isExclusive;
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
     * @param {Record<string, Set<string>>} excludedEntries A record of all entries that are impossible to obtain {WHEEL_NAME: [ENTRY_1, ENTRY_2, ...]}
     * @return @typedef {Object} @property {number} weight @property {WheelEntry|null} wheelEntry The wheel entry that got pulled and the winning weight
     */
    pullWeightedWheelEntry(excludedEntries) {
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

        // Not rigged (or failed to rig), but exclusive
        if (this.isExclusive && excludedEntries.hasOwnProperty(this.getName())) {
            // Filter out all excluded wheel entries
            const filteredWheelEntries = this.wheelEntries.map((wheelEntry) => {
                if (excludedEntries[this.getName()].has(wheelEntry.getValue())) {
                    return;
                }
                else {
                    return wheelEntry;
                }
            });
            // If there are no entries left, return nothing
            if (filteredWheelEntries.length == 0) { return {"weight": 0, "wheelEntry": new WheelEntry("", 0, new Array())}; }
           
            const tempTotalWeight = filteredWheelEntries.reduce((acc, wheelEntry) => {
                if (!wheelEntry) { return acc; }
                return acc + wheelEntry.getWeight();
            }, 0);
            const winningWeight = tempTotalWeight * Math.random();
            let tempWeight = winningWeight;

            for (const wheelEntry of filteredWheelEntries) {
                if (!wheelEntry) { continue; }
                tempWeight -= wheelEntry.getWeight();
                if (tempWeight <= 0) {
                    return {"weight": winningWeight, "wheelEntry": wheelEntry};
                }
            }
        }

        // Not rigged or exclusive
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
     * Sets the buffer canvas of this wheel.
     * Typically used for cached wheels.
     * @param {HTMLCanvasElement} canvasBuffer 
     */
    setCanvasBuffer(canvasBuffer) {
        this.canvasBuffer = canvasBuffer;
        this.contextBuffer = this.canvasBuffer.getContext("2d");
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
}
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
function updateWheelJSON(json, key="Unknown") {
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
}// @ts-check


/** @typedef {import("./update.js").SavedWheelEntry} SavedWheelEntry */
/** @typedef {import("./update.js").WheelSettings} WheelSettings */
/** @typedef {import("./update.js").SavedWheel} SavedWheel */


/** @type {boolean} True if editing entries through text */
let textModeActive = false;
/** @type {Array<Wheel>} All the wheels on screen. The first wheel in the list is the one being edited on the left */
let wheels = new Array();
/** @type {Record<string, Set<string>>} A record of all entries that are impossible to obtain from exclusive wheel {WHEEL_NAME: [ENTRY_1, ENTRY_2, ...]} */
let excludedEntries = {};
/** @type {Wheel|null} The wheel that is currently being edited. */
let editingWheel = null;




/* ---------------- Wheel Caching ---------------- */

/**
 * Goes through the saved wheels and caches them all.
 * The expectation is that this is called asyncronously.
 */
function cacheSavedWheels() {
    _cacheSavedWheels().then(() => {});
}


/**
 * Should ONLY be called by cacheSavedWheels()!
 * Goes through the saved wheels and caches them all.
 * The expectation is that this is called asyncronously.
 * @return {Promise<any>} A async promise to run to cache wheels.
 */
async function _cacheSavedWheels() {
    const savedJSONs = getSavedWheels();
    let cachedNumber = 0;
    for (const [wheelName, json] of Object.entries(savedJSONs)) {
        const wheel = Wheel.fromJSON(json, false, false);
        cacheWheel(wheel);
        cachedNumber++;
    }

    console.log(`Cached ${Object.keys(Wheel.CACHED_WHEELS).length} Wheels!`);
}


/**
 * Caches the given wheel (asyncronously)
 * @param {Wheel} wheel The wheel to cache
 */
function cacheWheel(wheel) {
    _cacheWheel(wheel);
}


/**
 * Caches the given wheel asyncronously
 * @param {Wheel} wheel The wheel to cache;
 */
async function _cacheWheel(wheel) {
    const name = wheel.name || "unknown";
    const id = `cached-wheel_${name.replaceAll("\"","'")}`;
    let canvasBuffer = null;
    // Try to find existing buffer
    for (const cachedWheel of Object.values(Wheel.CACHED_WHEELS)) {
        if (cachedWheel.name == name) {
            canvasBuffer = cachedWheel.canvasBuffer;
        }
    }
    // Make new canvas if it doesn't exit
    if (canvasBuffer == null || !(canvasBuffer instanceof HTMLElement)) {
        canvasBuffer = document.createElement('canvas');
        if (!(canvasBuffer instanceof HTMLCanvasElement)) { return; }
        canvasBuffer.height = 640;
        canvasBuffer.width = 640;
        canvasBuffer.id = id;
    }

    if (!(canvasBuffer instanceof HTMLCanvasElement)) { return; }
    wheel.setCanvasBuffer(canvasBuffer);
    wheel.makeBuffer();
    
    Wheel.CACHED_WHEELS[name] = wheel;
}


/**
 * Reloads the wheel list (the wheel select)
 */
function reloadWheelBrowser() {
    const root = document.createDocumentFragment();
    const browser = document.getElementById('wheel-select-browser');
    if (browser == null || !(browser instanceof HTMLElement)) { return; }

    for (const wheel of Object.values(getSavedWheels())) {
        const wheelItem = document.createElement('li');
        wheelItem.className = 'wheel-select-wheel';
        wheelItem.textContent = wheel.name;

        // Add event listeners (for loading the next wheel)
        wheelItem.addEventListener('click', (event) => {
            if (!(event instanceof MouseEvent)) { return; }
            if (event.shiftKey || event.ctrlKey || event.metaKey) { return; }
            loadWheelData(wheel);
        });
        
        wheelItem.addEventListener('contextmenu', openWheelSelectMenu);

        root.appendChild(wheelItem);
    }

    browser.replaceChildren(root);
}




/* ---------------- Wheel Entries ---------------- */

/**
 * Adds an entry to the exclusion list
 * @param {string} wheelName The name of the wheel to exclude the entry from
 * @param {string} entryValue The text (value) of the entry to exclude
 */
function addExcludedEntry(wheelName, entryValue) {
    if (entryValue == "") { return; }
    if (!excludedEntries.hasOwnProperty(wheelName)) {
        excludedEntries[wheelName] = new Set();
    }
    excludedEntries[wheelName].add(entryValue);
}

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
            <td><input class="text-entry" value="${wheelEntry.getValue()}"></td>
            <td><input class="weight-entry" type="number" min="1" value="${wheelEntry.getWeight()}"></td>
            <td><input class="tag-entry" value="${wheelEntry.getTags()}"></td>
            <td><button class="delete-entry-button" data-i="${i}">✕</button></td>
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
                updateWheelEntriesCount();
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

        function addNewRow() {
            addWheelEntry();

            if (DOM_ELEMENTS.tableBody == null || 
                DOM_ELEMENTS.tableBody.lastChild == null ||
                !(DOM_ELEMENTS.tableBody.lastChild instanceof HTMLElement) ||
                DOM_ELEMENTS.tableBody.lastChild.childNodes[1] == null ||
                !(DOM_ELEMENTS.tableBody.lastChild.childNodes[1] instanceof HTMLElement) ||
                DOM_ELEMENTS.tableBody.lastChild.childNodes[1].childNodes[0] == null ||
                !(DOM_ELEMENTS.tableBody.lastChild.childNodes[1].childNodes[0] instanceof HTMLElement)
            ) { return; }
            DOM_ELEMENTS.tableBody.lastChild.childNodes[1].childNodes[0].focus();
        }

        // Whenever <Enter> is pressed, it makes a new element
        wheelEntryCell.addEventListener("keydown", e => {
            // Typescript why
            if (!(e instanceof KeyboardEvent)) { return; }
            if (e.key === "Enter") {
                e.preventDefault();
                addNewRow();
            }
        });
        weightCell.addEventListener("keydown", e => {
            // Typescript why
            if (!(e instanceof KeyboardEvent)) { return; }
            if (e.key === "Enter") {
                e.preventDefault();
                addNewRow();
            }
        });
        tagsCell.addEventListener("keydown", e => {
            // Typescript why
            if (!(e instanceof KeyboardEvent)) { return; }
            if (e.key === "Enter") {
                e.preventDefault();
                addNewRow();
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
    if (editingWheel == null || DOM_ELEMENTS.textModeInput == null) { return; }
    if (!(DOM_ELEMENTS.textModeInput instanceof HTMLTextAreaElement)) { return; }
    const lines = editingWheel.getWheelEntries().map(wheelEntry => {
        return wheelEntry.toText();
    });
    DOM_ELEMENTS.textModeInput.value = lines.join("\n");
    updateTextArea();
}

/**
 * This overwrites all existing wheel entries with the text area entries.
 */
function convertTextModeAreaToWheelEntries() {
    if (DOM_ELEMENTS.textModeInput == null || !(DOM_ELEMENTS.textModeInput instanceof HTMLTextAreaElement)) { return; }
    if (editingWheel == null) { return null; }
    const lines = DOM_ELEMENTS.textModeInput.value.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
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
 * Takes in the given line of text and parses it into formatted.
 * @param {string} text A line of text in the text area
 * @returns {string} The formatted text using spans.
 */
function parseTextLine(text) {
    let result = "";
    let i = 0;
    const len = text.length;

    let mode = 0; // 0=values, 1=num, 2=tags

    /**
     * Wraps the given token
     * @param {string} token The token (text) to wrap
     */
    function wrapToken(token) {
        // Check if token contains one or more {...} blocks
        let buffer = "";
        let j = 0;
        while (j < token.length) {
            if (token[j] === "{") {
                // flush any buffer before {
                if (buffer.length > 0) {
                    if (mode === 0) result += wrapInSpan(buffer, "tm_value");
                    else if (mode === 1) result += wrapInSpan(buffer, "tm_weight");
                    else if (mode === 2) result += wrapInSpan(buffer, "tm_tag");
                    buffer = "";
                }
                // collect {...}
                let block = "{";
                j++;
                while (j < token.length) {
                    if (token[j] === "\\") { // escape
                        block += token[j];
                        j++;
                        if (j < token.length) block += token[j];
                        j++;
                        continue;
                    }
                    block += token[j];
                    if (token[j] === "}") { j++; break; }
                    j++;
                }
                result += wrapInSpan(block, "tm_subwheel");
            } else {
                buffer += token[j];
                j++;
            }
        }
        // flush remaining
        if (buffer.length > 0) {
            if (mode === 0) result += wrapInSpan(buffer, "tm_value");
            else if (mode === 1) result += wrapInSpan(buffer, "tm_weight");
            else if (mode === 2) result += wrapInSpan(buffer, "tm_tag");
        }
    }

    while (i < len) {
        let char = text[i];

        // Handle escape
        if (char === "\\") {
            i++;
            if (i < len) {
                result += text[i];
                i++;
            }
            continue;
        }

        // Handle pipe
        if (char === "|") {
            result += wrapInSpan("|", "tm_pipe");
            mode++;
            i++;
            continue;
        }

        // Collect a token until space or pipe
        let token = "";
        while (i < len && text[i] !== " " && text[i] !== "|") {
            if (text[i] === "\\") {
                token += text[i];
                i++;
                if (i < len) token += text[i];
                i++;
                continue;
            }
            token += text[i];
            i++;
        }

        if (token.length > 0) wrapToken(token);

        // preserve space
        if (i < len && text[i] === " ") { result += " "; i++; }
    }

    return result;
}


/**
 * Formats all the text in the text area correctly
 */
function updateTextArea() {
    if (DOM_ELEMENTS.textModeInput == null || !(DOM_ELEMENTS.textModeInput instanceof HTMLTextAreaElement)) { return; }
    if (DOM_ELEMENTS.textModeVisible == null) { return; }
    const text = DOM_ELEMENTS.textModeInput.value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    let output = "";
    const entries = text.split("\n");
    for (const entry of entries) {
        output += parseTextLine(entry) + "\n";
    }

    DOM_ELEMENTS.textModeVisible.innerHTML = output;
}


/**
 * Wraps the given text in a span with the provided class
 * @param {string} text The text to be wrapped in a span
 * @param {string} className The class to give the span
 * @return {string} The span in text form.
 */
function wrapInSpan(text, className) {
    return `<span class="${className}">${text}</span>`
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
    DOM_ELEMENTS.wheelEntriesCountSpan.textContent = totalWheelEntries.toString();
    if (editingWheel == null || DOM_ELEMENTS.wheelEntriesWeightSpan == null) { return; }
    const totalWeight = editingWheel.totalWeight;
    DOM_ELEMENTS.wheelEntriesWeightSpan.textContent = totalWeight.toString();
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
        div.className = "tag-toggle";

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
    stopSpinning();
    clearSubWheels();
    if (editingWheel == null) { return; }
    editingWheel.spin(Date.now(), null, excludedEntries);
}


/**
 * Makes all wheels stop spinning
 */
function stopSpinning() {
    for (const wheel of wheels) {
        wheel.stopSpinning();
    }
    excludedEntries = {};
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
                if (!wheel.hasResult) { wheel.spin(Date.now(), null, excludedEntries); }
            }
        }
        else {
            showWinner()
            for (const wheel of wheels) {
                wheel.resultHandled();
            }
        }
    }

    // if (DOM_ELEMENTS.fpsCounter != null) {
    //     DOM_ELEMENTS.fpsCounter.textContent = String(Math.min(1000, Math.round(1000.0 / (performance.now() - startTime))));
    // }
}


/**
 * Brings up the winning entry card for the primary wheel
 */
function showWinner() {
    if (DOM_ELEMENTS.winnerText == null || DOM_ELEMENTS.modal == null || editingWheel == null) { return; }
    const winningWheelText = editingWheel.getWinningWheelText();
    DOM_ELEMENTS.winnerText.textContent = winningWheelText || "";
    showModal(DOM_ELEMENTS.modal);
}


/* ------------- Utilities ------------- */
const cardContainer = document.getElementById("card-container");

/**
 * Makes a "toast" card at the top of the screen showing msg for a short duration
 * @param {string} msg The message to be displayed 
 * @param {number} seconds The lifespan of the card in seconds (default is 3)
 */
function showCard(msg, seconds = 3) {
    if (cardContainer == null) { return; }
    const card = document.createElement("div");
    card.className = "toast-card";
    card.textContent = msg;

    const bar = document.createElement("div");
    bar.className = "toast-bar";

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
        if (wheel.getSubLevel() > subLevels) {
            subLevels = wheel.subLevel;
        }
    }

    const maxHeight = DOM_ELEMENTS.wheelWrapper.clientHeight;
    const wheelHeight = maxHeight / (subLevels+1);

    // Connections canvas (always there)
    let html = `<canvas id="wheel-connections" width="640" height="640"></canvas>\n`;
    // Build canvases row-by-row
    let i = 0;
    for (let level = 0; level <= subLevels; level++) {
        // html += `<div class="wheel-row" style="height=${wheelHeight};left=0;top=${wheelHeight*level};">\n`;
        html += `<div class="wheel-row" style="height=${wheelHeight};">\n`;
        for (const wheel of wheels) {
            if (wheel.getSubLevel() != level) {
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
    // TODO: Make this actually wait until the DOM elements are loaded, then just do it instantly
    setTimeout(() => {
        for (const wheel of wheels) {
            wheel.setCanvasFromID();
            wheel.makeBuffer();
        }
        // Next up, draw a bunch of lines between them all
        const wheelConnections = document.getElementById("wheel-connections");
        if (wheelConnections == null || !(wheelConnections instanceof HTMLCanvasElement)) { return; }
        const connectionsContext = wheelConnections.getContext("2d");
        if (connectionsContext == null || !(connectionsContext instanceof CanvasRenderingContext2D)) { return; }
        const rect = wheelConnections.getBoundingClientRect();
        wheelConnections.width = rect.width;
        wheelConnections.height = rect.height;
        const ox = rect.left;
        const oy = rect.top;
        let parentRect, px, py, pr;
        let childRect, cx, cy, cr;
        let d, vx, vy;
        let canvas, subCanvas;
        connectionsContext.clearRect(0, 0, wheelConnections.width, wheelConnections.height);
        for (const wheel of wheels) {
            canvas = wheel.getCanvas();
            if (canvas == null) { continue; }
            parentRect = canvas.getBoundingClientRect();
            px = parentRect.left + parentRect.width * 0.5;
            py = parentRect.top + parentRect.height * 0.5;
            pr = parentRect.width * 0.475;
            for (const subWheel of Object.values(wheel.subWheels)) {
                subCanvas = subWheel.getCanvas();
                if (subCanvas == null) { continue; }
                childRect = subCanvas.getBoundingClientRect();
                cx = childRect.left + childRect.width * 0.5;
                cy = childRect.top + childRect.height * 0.5;
                cr = childRect.width * 0.475
                // Math time to find the shortest path between them.
                // Find normalized vector between them
                vx = cx - px;
                vy = cy - py;
                d = Math.sqrt(vx*vx + vy*vy);
                vx = vx / d;
                vy = vy / d;
                // Use the normal to find the shortest path
                connectionsContext.save();
                connectionsContext.beginPath();
                connectionsContext.moveTo(px+vx*pr - ox, py+vy*pr - oy);
                connectionsContext.lineTo(cx-vx*cr - ox, cy-vy*cr - oy);
                connectionsContext.lineWidth = 0.5;
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
            wheels[i].clearSubwheels();
        }
    }

    restructureWheels();
}


/* ---------------- Persistence ---------------- */

/**
 * Tries to update all saved wheels
 */
function updateSavedWheels() {
    const savedWheels = getSavedWheels();
    for (const [key, json] of Object.entries(savedWheels)) {
        const updatedJSON = updateWheelJSON(json, key);
        if (updatedJSON != null) { savedWheels[key] = updatedJSON; }
    }
    setSavedWheels(savedWheels);
}


/**
 * All the saved wheels in local cache
 * @returns {Record<string, SavedWheel>} All the saved wheels in the local cache
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
    reloadWheelBrowser();
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
    reloadWheelBrowser();
    cacheWheel(editingWheel);
}

/**
 * Clears the cache. Used only for debugging.
 */
function clearCache() {
    localStorage.setItem("wheelState", "");
}

/**
 * Loads the most recently used wheel.
 * Also tries to update the wheel at the same time.
 */
function loadMostRecentWheel() {
    const saved = localStorage.getItem("wheelState");
    if (saved && saved != "") {
        const wheel = JSON.parse(saved);
        const updatedWheel = updateWheelJSON(wheel);
        if (updatedWheel != null) {
            loadWheelData(updatedWheel);
        }
        else {
            loadWheelData(wheel);
        }
    }
}

/**
 * Loads the given JSON data into the currently editable wheel
 * @param {import("./wheel.js").SavedWheel} json The data to load (typically gotten from Wheel.toJSON)
 */
function loadWheelData(json) {
    clearSubWheels();
    if (editingWheel == null) {
        editingWheel = Wheel.fromJSON(json, true);
    }
    else {
        editingWheel.fromJSON(json)
    }
    if (DOM_ELEMENTS.canvas != null && DOM_ELEMENTS.canvas instanceof HTMLCanvasElement)
        editingWheel.setCanvas(DOM_ELEMENTS.canvas);
    rebuildTable();
    populateTextModeArea();
    restructureWheels();
}


/**
 * Deletes the given wheel from the cache and more
 * @param {string} wheelName The name of the wheel to delete
 */
function deleteWheel(wheelName) {
    let all = JSON.parse(localStorage.getItem("savedWheels") || "{}");
    delete all[wheelName];
    setSavedWheels(all);
}


/* ---------------- Init/Main ---------------- */


/**
 * Adds a bunch of keybinds to the website including...
 * Ctrl + S: save
 * Ctrl + Shift + S: save as
 * Ctrl + m : make new wheel
 * Ctrl + ' ' : spin
 */
function addKeyBinds() {
    document.addEventListener("keydown", (e) => {
        // Ctrl + S : Save
        if (e.key === "s" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
            e.preventDefault();
            save();
        }
        // Ctrl + Shift + S : Save As
        if (e.key.toLowerCase() === "s" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
            e.preventDefault();
            openSaveAsModal();
        }
        // Ctrl + m: Make New Wheel
        if (e.key.toLowerCase() === "m" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
            e.preventDefault();
            loadWheelData(Wheel.baseWheel().toJSON()); 
            showCard("Made New Wheel!", 2);
            saveState();
        }
        // Ctrl + ' ' : Spin
        if (e.key.toLowerCase() === " " && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
            e.preventDefault();
            spin();
        }
    }, false); 
}


/**
 * Sets up tool tips for any element with the .has-tooltip class
 */
function setupTooltips() {
    document.querySelectorAll('.has-tooltip').forEach(hasTooltip => {
        const tooltip = hasTooltip.querySelector('.tooltip');
        if (!tooltip) return;

        hasTooltip.addEventListener('mouseenter', () => {
            if (!(tooltip instanceof HTMLElement)) { return; }
            const rect = hasTooltip.getBoundingClientRect();

            document.body.appendChild(tooltip);
            tooltip.style.display = 'block';
            tooltip.style.position = 'fixed';

            tooltip.style.left = rect.right + 'px';
            tooltip.style.top = (rect.top - tooltip.offsetHeight) + 'px';
        });

        hasTooltip.addEventListener('mouseleave', () => {
            if (!(tooltip instanceof HTMLElement)) { return; }
            tooltip.style.display = 'none';
            hasTooltip.appendChild(tooltip); // put it back
        });
    });
}


document.addEventListener("DOMContentLoaded", () => {
    cacheSavedWheels();

    editingWheel = Wheel.baseWheel();
    wheels.push(editingWheel)
    // Update all cached wheels
    updateSavedWheels();
    // Attempt to load wheel from cache
    loadMostRecentWheel();
    initializeDOMStuff(spin);

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
            if (DOM_ELEMENTS.tableBody.parentElement.parentElement != null)
                DOM_ELEMENTS.tableBody.parentElement.parentElement.classList.add("hidden"); // hide table container
            DOM_ELEMENTS.textModeArea.classList.remove("hidden");
            populateTextModeArea();
        } else {
            if (DOM_ELEMENTS.tableBody.parentElement.parentElement != null)
                DOM_ELEMENTS.tableBody.parentElement.parentElement.classList.remove("hidden");
            DOM_ELEMENTS.textModeArea.classList.add("hidden");
            convertTextModeAreaToWheelEntries(); // sync back into table
        }
    };

    // Autosave while typing
    if (DOM_ELEMENTS.textModeInput != null)
    DOM_ELEMENTS.textModeInput.addEventListener("input", () => {
        convertTextModeAreaToWheelEntries();
    });

    // Shuffle button
    if (DOM_ELEMENTS.shuffleButton != null)
    DOM_ELEMENTS.shuffleButton.onclick = () => {
        if (editingWheel == null) { return; }
        editingWheel.shuffleEntries();
        rebuildTable();
        showCard("Shuffled!", 1);
    };

    // Force stop spinning
    document.addEventListener("keydown", (e) => {
        if (!(e instanceof KeyboardEvent)) { return; }
        if (e.key === "Escape") {
            stopSpinning();
        }
    });

    setInterval(update, 10);
    restructureWheels();

    addKeyBinds();
    setupTooltips();
});