 // @ts-check
import { Wheel } from "./wheel";
import { deleteWheel, editingWheel, setSavedWheels, getSavedWheels, showCard, loadWheelData, saveState, updateTextArea } from "./main.js";

 export const DOM_ELEMENTS = {
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
     loadWheelButton: document.getElementById("load-wheel-button"),
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

     savedWheelsList: document.getElementById("saved-wheels-list"),
     closeLoadButton: document.getElementById("close-load-button"),

     saveModal: document.getElementById("save-modal"),
     loadModal: document.getElementById("load-modal"),

     saveNameInput: document.getElementById("save-name-input"),
     loadList: document.getElementById("load-list"),

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


/** @type {Wheel|null} The wheel being right clicked on in the wheel select */
let selectedWheel = null;





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

    DOM_ELEMENTS.saveNameInput.addEventListener("keypress", (e) => {
        if (e instanceof KeyboardEvent && e.key === "enter") {
            saveAs();
        }
    });

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
    showCard("Saved Successfully!", 4);
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
export function showModal(modal) {
    if (modal == null) { return; }
    modal.classList.remove("hidden");

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.add("hidden");
        }
    });
}


/**
 * Opens up the wheel select menu
 * @param {Event} e The event that called this open
 */
export function openWheelSelectMenu(e) {
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
        selectedWheel = Wheel.fromJSON(selectedJSON, true);
    }
    else {
        selectedWheel = null;
    }
    
}


/**
 * Deletes the selected wheel (if it exists)
 * @param {Event} e The event of pressing the button
 */
function deleteSelectedWheel(e) {
    if (selectedWheel == null) { return; }
    deleteWheel(selectedWheel);
}


/**
 * Initializes all the DOM stuff given the primary wheel
 * @param {() => void} spin Call this to spin the wheel.
 */
export function initializeDOMStuff(spin) {
    if (DOM_ELEMENTS.cancelSaveAsButton != null) {
        DOM_ELEMENTS.cancelSaveAsButton.onclick = () => {
            if (DOM_ELEMENTS.saveModal !=  null) {
                DOM_ELEMENTS.saveModal.classList.add("hidden");
            }
        };
    }
    if (DOM_ELEMENTS.closeLoadButton != null && DOM_ELEMENTS.loadModal !=  null) {
        DOM_ELEMENTS.closeLoadButton.onclick = () => {
            if (DOM_ELEMENTS.loadModal !=  null) {
                DOM_ELEMENTS.loadModal.classList.add("hidden");
            }
        };
    }

    // General Modal
    if (DOM_ELEMENTS.closeModalButton != null) {
        DOM_ELEMENTS.closeModalButton.onclick = () => {
            if (DOM_ELEMENTS.modal == null) { return; }
            DOM_ELEMENTS.modal.classList.add("hidden");
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

    document.addEventListener('click', () => {
        if (DOM_ELEMENTS.wheelSelectWheelMenu != null && DOM_ELEMENTS.wheelSelectWheelMenu instanceof HTMLElement) {
            DOM_ELEMENTS.wheelSelectWheelMenu.classList.add('hidden');
        }
    });

    if (DOM_ELEMENTS.wheelSelectWheelMenuDelete != null && DOM_ELEMENTS.wheelSelectWheelMenuDelete instanceof HTMLElement) {
        DOM_ELEMENTS.wheelSelectWheelMenuDelete.addEventListener('click', deleteSelectedWheel);
    }


    // Text Area Coloring
    if (DOM_ELEMENTS.textModeInput != null && DOM_ELEMENTS.textModeVisible != null && DOM_ELEMENTS.textModeArea != null &&
        DOM_ELEMENTS.textModeInput instanceof HTMLTextAreaElement
    ) {
        DOM_ELEMENTS.textModeInput.addEventListener('input', updateTextArea);

        // Optional: sync scroll
        DOM_ELEMENTS.textModeInput.addEventListener('scroll', () => {
            if (DOM_ELEMENTS.textModeVisible == null || DOM_ELEMENTS.textModeArea == null) { return; }
            DOM_ELEMENTS.textModeVisible.scrollTop = DOM_ELEMENTS.textModeArea.scrollTop;
            DOM_ELEMENTS.textModeVisible.scrollLeft = DOM_ELEMENTS.textModeArea.scrollLeft;
        });

        // Focus div when user clicks
        DOM_ELEMENTS.textModeVisible.addEventListener('click', () => { if (DOM_ELEMENTS.textModeArea != null) DOM_ELEMENTS.textModeArea.focus() });
    }
}