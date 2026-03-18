// @ts-check
import { Wheel, WheelEntry } from './wheel.js'
import { initializeDOMStuff, DOM_ELEMENTS } from './dom_stuff.js'
import { updateWheelJSON } from "./update.js";


/** @typedef {import("./update.js").SavedWheelEntry} SavedWheelEntry */
/** @typedef {import("./update.js").WheelSettings} WheelSettings */
/** @typedef {import("./update.js").SavedWheel} SavedWheel */


/** @type {boolean} True if editing entries through text */
let textModeActive = false;
/** @type {Record<string, Wheel>} A dictionary of all cached (saved) wheels. Is refreshed upon save. */
let cachedWheels = {};
/** @type {Array<Wheel>} All the wheels on screen. The first wheel in the list is the one being edited on the left */
let wheels = new Array();
/** @type {Wheel|null} The wheel that is currently being edited. */
let editingWheel = null;




/* ---------------- Wheel Caching ---------------- */

/**
 * Goes through the saved wheels and caches them all.
 * The expectation is that this is called asyncronously.
 */
function cacheSavedWheels() {
    _cacheSavedWheels().then(() => {console.log(`Cached ${Object.keys(Wheel.CACHED_WHEELS).length} Wheels!`); });
}


/**
 * Should ONLY be called by cacheSavedWheels()!
 * Goes through the saved wheels and caches them all.
 * The expectation is that this is called asyncronously.
 * @return {Promise<any>} A async promise to run to cache wheels.
 */
async function _cacheSavedWheels() {
    cachedWheels = {};
    const savedJSONs = getSavedWheels();
    for (const [wheelName, json] of Object.entries(savedJSONs)) {
        cachedWheels[wheelName] = Wheel.fromJSON(json, false);
    }
    Wheel.CACHED_WHEELS = cachedWheels;
}




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
    DOM_ELEMENTS.modal.classList.remove("hidden");
}


/* ------------- Utilities ------------- */
const cardContainer = document.getElementById("card-container");

/**
 * Makes a "toast" card at the top of the screen showing msg for a short duration
 * @param {string} msg The message to be displayed 
 * @param {number} seconds The lifespan of the card in seconds (default is 3)
 */
export function showCard(msg, seconds = 3) {
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
 * Loads the most recently used wheel.
 * Also tries to update the wheel at the same time.
 */
function loadState() {
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
export function loadWheelData(json) {
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
}


/* ---------------- Init/Main ---------------- */
document.addEventListener("DOMContentLoaded", () => {
    cacheSavedWheels();

    editingWheel = Wheel.baseWheel();
    wheels.push(editingWheel)
    // Update all cached wheels
    updateSavedWheels();
    // Attempt to load wheel from cache
    loadState();
    initializeDOMStuff(editingWheel, saveState, spin, cacheSavedWheels);

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
    if (DOM_ELEMENTS.shuffleButton != null)
    DOM_ELEMENTS.shuffleButton.onclick = () => {
        if (editingWheel == null) { return; }
        editingWheel.shuffleEntries();
        rebuildTable();
        showCard("Shuffled!", 1);
    };

    setInterval(update, 10);
});