 // @ts-check
import { Wheel } from "./wheel";
import { setSavedWheels, getSavedWheels, showCard, loadWheelData } from "./main.js";

 export const DOM_ELEMENTS = {
     canvas: document.getElementById("wheelCanvas"),

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
     victorySoundSelect: document.getElementById("victorySoundSelect")
};


/**
 * Initializes all the DOM stuff given the primary wheel
 * @param {Wheel} editingWheel The wheel that is currently being edited
 * @param {() => void} saveState Call this to save the settings in the wheel
 */
export function initializeDOMStuff(editingWheel, saveState) {
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
    if (DOM_ELEMENTS.canvas != null && DOM_ELEMENTS.canvas instanceof HTMLInputElement) {
        DOM_ELEMENTS.canvas.onclick = () => { editingWheel.spin((new Date()).getTime()) };
    }
    if (DOM_ELEMENTS.spinBtn != null) {
        DOM_ELEMENTS.spinBtn.onclick = () => { editingWheel.spin((new Date()).getTime()) };
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
            wheels[name] = editingWheel.toJSON();

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

            showCard("Saved!", 2)

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