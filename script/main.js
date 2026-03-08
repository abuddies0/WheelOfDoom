// @ts-check
import { Wheel, WheelEntry } from './wheel.js'
import { initializeDOMStuff, DOM_ELEMENTS } from './dom_stuff.js'


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


/* ---------------- Drawing ---------------- */

/**
 * Draws all of the wheels
 */
function update() {
    // TODO: Make this use requestAnimationFrame()
    let hasResult = true
    for (const wheel of wheels) {
        wheel.update(Date.now());
        hasResult = hasResult && wheel.hasResult;
    }
    if (hasResult) {
        showWinner()
        for (const wheel of wheels) {
            wheel.hasResult = false;
        }
    }
}


/**
 * Brings up the winning entry card for the primary wheel
 */
function showWinner() {
    if (DOM_ELEMENTS.winnerText == null || DOM_ELEMENTS.modal == null || editingWheel == null) { return; }
    const winningWheelEntry = editingWheel.getWinningWheelEntry();
    DOM_ELEMENTS.winnerText.textContent = winningWheelEntry ? winningWheelEntry.getValue() : "Nothing L Bozo";
    DOM_ELEMENTS.modal.classList.remove("hidden");
}


/* ------------- Utilities ------------- */
const cardContainer = document.getElementById("cardContainer");

/**
 * Makes a "toast" card at the top of the screen showing msg for a short duration
 * @param {string} msg The message to be displayed 
 * @param {number} seconds The lifespan of the card in seconds (default is 3)
 */
export function showCard(msg, seconds = 3) {
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


/* ---------------- Persistence ---------------- */

/**
 * All the saved wheels in local cache
 * @returns {Object} All the saved wheels in the local cache
 */
export function getSavedWheels() {
    return JSON.parse(localStorage.getItem("savedWheels") || "{}");
}


/**
 * Sets the saved wheels in local cache to the provided JSON
 * @param {Object} json The JSON of all saved wheels
 */
export function setSavedWheels(json) {
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
export function loadWheelData(json) {
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
    initializeDOMStuff(editingWheel, saveState);

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