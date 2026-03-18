 // @ts-check
import { Wheel } from "./wheel";
import { setSavedWheels, getSavedWheels, showCard, loadWheelData } from "./main.js";

 export const DOM_ELEMENTS = {
     canvas: document.getElementById("main-wheel-canvas"),
     wheelWrapper: document.getElementById("wheel-wrapper"),

    // Wheel Entries
     tableBody: document.querySelector("#wheel-entry-table tbody"),
     tagFiltersDiv: document.getElementById("tag-filters"),
     textModeSwitch: document.getElementById("text-mode-switch"),
     textModeArea: document.getElementById("text-mode-area"),
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

     // Debug Stuff
     fpsCounter: document.getElementById("fps")
};


/**
 * Initializes all the DOM stuff given the primary wheel
 * @param {Wheel} editingWheel The wheel that is currently being edited
 * @param {() => void} saveState Call this to save the settings in the wheel
 * @param {() => void} spin Call this to spin the wheel.
 * @param {() => void} cacheSavedWheels Call this to cache all saved wheels.
 */
export function initializeDOMStuff(editingWheel, saveState, spin, cacheSavedWheels) {
    if (DOM_ELEMENTS.cancelSaveAsButton != null) {
        DOM_ELEMENTS.cancelSaveAsButton.onclick = () => { if (DOM_ELEMENTS.saveModal !=  null) DOM_ELEMENTS.saveModal.classList.add("hidden")};
    }
    if (DOM_ELEMENTS.closeLoadButton != null && DOM_ELEMENTS.loadModal !=  null) {
        DOM_ELEMENTS.closeLoadButton.onclick = () => { if (DOM_ELEMENTS.loadModal !=  null) DOM_ELEMENTS.loadModal.classList.add("hidden")};
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
            if (DOM_ELEMENTS.winSoundSelect != null && DOM_ELEMENTS.winSoundSelect instanceof HTMLInputElement)
                DOM_ELEMENTS.winSoundSelect.value = Wheel.getWinSoundFromAudio(editingWheel.winSound) || "";
        };
    }

    if (DOM_ELEMENTS.closeSettingsButton != null) {
        DOM_ELEMENTS.closeSettingsButton.onclick = () => {
            if (DOM_ELEMENTS.settingsModal == null) { return null; }
            DOM_ELEMENTS.settingsModal.classList.add("hidden");
        };
    }

    // Spin the wheel
    if (DOM_ELEMENTS.wheelWrapper != null && DOM_ELEMENTS.wheelWrapper instanceof HTMLInputElement) {
        DOM_ELEMENTS.wheelWrapper.onclick = () => { spin(); };
    }
    if (DOM_ELEMENTS.spinButton != null) {
        DOM_ELEMENTS.spinButton.onclick = () => { spin(); };
    }

    // Import / Export
    if (DOM_ELEMENTS.exportButton != null) {
        DOM_ELEMENTS.exportButton.onclick = () => {
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
    
    if (DOM_ELEMENTS.importButton != null) {
        DOM_ELEMENTS.importButton.onclick = () => { if (DOM_ELEMENTS.importFile != null) DOM_ELEMENTS.importFile.click() };
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
    if (DOM_ELEMENTS.copyButton != null) {
        DOM_ELEMENTS.copyButton.onclick = () => {
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
        cacheSavedWheels();
    }

    if (DOM_ELEMENTS.confirmSaveAsButton != null) {
        DOM_ELEMENTS.confirmSaveAsButton.onclick = () => {
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

    if (DOM_ELEMENTS.cancelSaveAsButton != null) {
        DOM_ELEMENTS.cancelSaveAsButton.onclick = () => {
            if (DOM_ELEMENTS.saveModal != null) { DOM_ELEMENTS.saveModal.classList.add("hidden"); }
        }
    }

    if (DOM_ELEMENTS.saveWheelButton != null) {
        DOM_ELEMENTS.saveWheelButton.onclick = () => {
            if (editingWheel == null) { return null; }
            if (editingWheel.getName() == null || editingWheel.getName() == "") {
                saveAs();
                return;
            }

            const wheels = getSavedWheels();
            wheels[editingWheel.getName()] = editingWheel.toJSON();

            showCard(`Saved '${editingWheel.getName()}'`, 2)

            setSavedWheels(wheels);
            cacheSavedWheels();
        };
    }

    if (DOM_ELEMENTS.saveAsWheelButton != null) {
        DOM_ELEMENTS.saveAsWheelButton.onclick = () => {
            saveAs();
        };
    }

    if (DOM_ELEMENTS.loadWheelButton != null) {
        DOM_ELEMENTS.loadWheelButton.onclick = () => {
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
            btns.className = "wheelButtons";

            const loadButton = document.createElement("button");
            loadButton.className = "primaryButton";
            loadButton.textContent = "Load";
            loadButton.onclick = () => {
                if (DOM_ELEMENTS.loadModal == null) { return; }
                loadWheel(name);
                DOM_ELEMENTS.loadModal.classList.add("hidden");
                showCard("Wheel Loaded", 3);
            };

            const delButton = document.createElement("button");
            delButton.className = "deleteButton";
            delButton.textContent = "Delete";
            delButton.onclick = () => {
                if (!confirm(`Delete "${name}"?`)) return;

                const wheels = getSavedWheels();
                delete wheels[name];
                setSavedWheels(wheels);

                rebuildLoadMenu();
                showCard("Deleted", 3);
            };

            btns.append(loadButton, delButton);
            row.append(title, btns);
            if (DOM_ELEMENTS.loadList == null) { return; }
            DOM_ELEMENTS.loadList.append(row);
        });
    }

    /** @param {string} name The name of the wheel */
    function loadWheel(name) {
        if (editingWheel == null) { return; }
        const wheels = getSavedWheels();
        if (!wheels[name]) {
            showCard(`Wheel "${name}" not found!`, 3);
            return;
        }

        loadWheelData(wheels[name])
        showCard(`Wheel "${name}" loaded!`, 3);
    }

    if (DOM_ELEMENTS.newWheelButton != null) {
        DOM_ELEMENTS.newWheelButton.onclick = () => {
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

    if (DOM_ELEMENTS.winSoundSelect != null) {
        DOM_ELEMENTS.winSoundSelect.oninput = e => {
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