const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");

// Wheel Entries
const tableBody = document.querySelector("#wheelEntryTable tbody");
const tagFiltersDiv = document.getElementById("tagFilters");
const textModeSwitch = document.getElementById("textModeSwitch");
const textModeArea = document.getElementById("textModeArea");
const shuffleBtn = document.getElementById("shuffleBtn");
const wheelEntriesCountSpan = document.getElementById("wheelEntriesCount");

// General toolbar buttons
const newWheelBtn = document.getElementById("newWheelBtn");
const saveWheelBtn = document.getElementById("saveWheelBtn");
const saveAsWheelBtn = document.getElementById("saveAsWheelBtn");
const loadWheelBtn = document.getElementById("loadWheelBtn");
const copyBtn = document.getElementById("copyBtn");
const importFile = document.getElementById("importFile");
const spinBtn = document.getElementById("spinBtn");

// Modals
const modal = document.getElementById("winnerModal");
const winnerText = document.getElementById("winnerText");
const closeModalBtn = document.getElementById("closeModalBtn");

const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");

const confirmSaveAsBtn = document.getElementById("confirmSaveAsBtn");
const cancelSaveAsBtn = document.getElementById("cancelSaveAsBtn");

const savedWheelsList = document.getElementById("savedWheelsList");
const closeLoadBtn = document.getElementById("closeLoadBtn");

const saveModal = document.getElementById("saveModal");
const loadModal = document.getElementById("loadModal");

const saveNameInput = document.getElementById("saveNameInput");
const loadList = document.getElementById("loadList");

cancelSaveAsBtn.onclick = () => saveModal.classList.add("hidden");
closeLoadBtn.onclick = () => loadModal.classList.add("hidden");

// Wheel Settings
const spinStrengthSlider = document.getElementById("spinStrengthSlider");
const spinStrengthNumber = document.getElementById("spinStrengthNumber");
const spinDurationSlider = document.getElementById("spinDurationSlider");
const spinDurationNumber = document.getElementById("spinDurationNumber");
const colorSchemeSelect = document.getElementById("colorSchemeSelect");
const spinSoundSelect = document.getElementById("spinSoundSelect");
const victorySoundSelect = document.getElementById("victorySoundSelect");
let settings = {
    spinStrength: 12,
    spinDuration: 3.5, // seconds
    colorScheme: "classic",
    spinSound: "metalpipe",
    victorySound: "yippee"
};

let spinSound = new Audio("asset/sound/metal_pipe.mp3");
spinSound.loop = true; // keep looping while spinning
const spinSounds = {
    metalpipe: "asset/sound/metal_pipe.mp3",
    silence: "asset/sound/silence.mp3"
}

let victorySound = new Audio("asset/sound/yippee.mp3");
spinSound.volume = 0.1;
victorySound.volume = 0.2;
const victorySounds = {
    yippee: "asset/sound/yippee.mp3",
    silence: "asset/sound/silence.mp3"
}

// Entry Settings
let textModeActive = false;

// Wheel(s) Data
let currentWheel = null;
let diameter = 650;
let radius = diameter / 2;
let angle = 0;
let spinning = false;

let wheelEntries = [];
let enabledTags = new Set();
let knownTags = new Set();




/* ---------------- Wheel Entries ---------------- */

function addWheelEntry(data = { tags: "", weight: 1, text: "" }) {
    wheelEntries.push(data);
    rebuildTable();
    // Returns the newest wheelEntry (the last one)
    return tableBody.lastChild;
}

function rebuildTable() {
    tableBody.innerHTML = "";

    wheelEntries.forEach((wheelEntry, i) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td><input class="textEntry" value="${wheelEntry.text}"></td>
            <td><input class="weightEntry" type="number" min="1" value="${wheelEntry.weight}"></td>
            <td><input class="tagEntry" value="${wheelEntry.tags}"></td>
            <td><button class="deleteEntryBtn" data-i="${i}">✕</button></td>
        `;

        tr.querySelectorAll("input").forEach(inp => {
            inp.oninput = () => {
                wheelEntry.text = tr.children[0].firstChild.value;
                wheelEntry.weight = +tr.children[1].firstChild.value || 1;
                wheelEntry.tags = tr.children[2].firstChild.value;

                updateTagFilters();
                saveState();
                drawWheel();
            };
        });

        tr.querySelector("button").onclick = () => {
            wheelEntries.splice(i, 1);
            rebuildTable();
        };

        const wheelEntryInput = tr.children[2].firstChild;

        wheelEntryInput.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                e.preventDefault();
                const newWheelEntry = addWheelEntry();
                newWheelEntry.childNodes[1].firstChild.focus();
            }
        });

        // Multiline pasting
        wheelEntryInput.addEventListener("paste", e => {
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
            wheelEntry.text = lines[0];
            wheelEntryInput.value = lines[0];

            // insert remaining as new entries
            const insertIndex = i + 1;

            const newOnes = lines.slice(1).map(line => ({
                tags: wheelEntry.tags,
                weight: wheelEntry.weight,
                text: line
            }));

            wheelEntries.splice(insertIndex, 0, ...newOnes);

            rebuildTable();
        });

        tableBody.appendChild(tr);
    });

    try {
        if (wheelEntries != null) { updateTagFilters(); } 
    } catch (e) {
        console.log(e)
    }
    updateWheelEntriesCount();
    saveState();
    drawWheel();

    makeTableDraggable();
}

// Helper: Convert wheelEntries -> textarea text
function updateTextModeArea() {
    const lines = wheelEntries.map(e =>
        `${e.text} | ${e.weight} | ${e.tags}`
    );
    textModeArea.value = lines.join("\n");
}

// Helper: Convert textarea text -> wheelEntries
function parseTextModeArea() {
    const lines = textModeArea.value.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const newEntries = lines.map(line => {
        const parts = line.split("|").map(p => p.trim());
        return {
            text: parts[0] || "",
            weight: +parts[1] || 1,
            tags: parts[2] || ""
        };
    });
    wheelEntries = newEntries;
    rebuildTable();
    updateTagFilters();
    saveState();
    drawWheel();
}

// Toggle Text Mode
textModeSwitch.onchange = () => {
    textModeActive = textModeSwitch.checked;

    if (textModeActive) {
        tableBody.parentElement.classList.add("hidden"); // hide table container
        textModeArea.classList.remove("hidden");
        updateTextModeArea();
    } else {
        tableBody.parentElement.classList.remove("hidden");
        textModeArea.classList.add("hidden");
        parseTextModeArea(); // sync back into table
    }
};

// Autosave while typing
textModeArea.addEventListener("input", () => {
    parseTextModeArea();
});


shuffleBtn.onclick = () => {
    for (let i = wheelEntries.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [wheelEntries[i], wheelEntries[j]] = [wheelEntries[j], wheelEntries[i]];
    }
    rebuildTable();
    saveState();
    showCard("Shuffled!", 1);
};

function makeTableDraggable() {
    let draggedIndex = null;

    tableBody.querySelectorAll("tr").forEach((tr, i) => {
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

            if (draggedIndex === null || draggedIndex === i) return;

            const movedItem = wheelEntries.splice(draggedIndex, 1)[0];
            wheelEntries.splice(i, 0, movedItem);

            rebuildTable();
            saveState();
        });
    });
}

function updateWheelEntriesCount() {
    const totalWheelEntries = wheelEntries.length;
    const totalWeight = wheelEntries.reduce((sum, e) => sum + (+e.weight || 1), 0);
    wheelEntriesCountSpan.textContent = `${totalWheelEntries}, ${totalWeight}`;
}

/* ---------------- Tags ---------------- */

function updateTagFilters() {
    const allTags = new Set();

    wheelEntries.forEach(r =>
        r.tags.split(",")
            .map(t => t.trim())
            .filter(Boolean)
            .forEach(t => allTags.add(t))
    );

    // remove tags that no longer exist
    [...enabledTags].forEach(t => {
        if (!allTags.has(t)) enabledTags.delete(t);
    });

    [...knownTags].forEach(t => {
        if (!allTags.has(t)) knownTags.delete(t);
    });

    // enable only *new* tags
    allTags.forEach(t => {
        if (!knownTags.has(t)) {
            enabledTags.add(t);
            knownTags.add(t);
        }
    });

    tagFiltersDiv.innerHTML = "";

    allTags.forEach(tag => {
        const div = document.createElement("div");
        div.className = "tagToggle";

        if (enabledTags.has(tag)) {
            div.classList.add("active");
        }

        div.textContent = tag;

        div.onclick = () => {
            div.classList.toggle("active");

            if (enabledTags.has(tag)) enabledTags.delete(tag);
            else enabledTags.add(tag);

            drawWheel();
            saveState();
        };

        tagFiltersDiv.appendChild(div);
    });
}

/* ---------------- Active WheelEntrys ---------------- */

function getActiveWheelEntrys() {
    // Return wheelEntries as {text, weight} objects, filtered by enabled tags
    return wheelEntries
        .filter(wheelEntry => {
            const tags = wheelEntry.tags.split(",").map(t => t.trim());
            return !tags.length || tags.some(t => enabledTags.has(t) || t=="");
        })
        .map(wheelEntry => ({ text: wheelEntry.text, weight: +wheelEntry.weight || 1 }));
}
/* ---------------- Drawing ---------------- */

function getTotalWeight() {
    const wheelEntries = getActiveWheelEntrys();

    let totalWeight = 0;
    for (const wheelEntry of wheelEntries) {
        totalWeight += wheelEntry["weight"];
    }

    return totalWeight;
}

function drawWheel() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    const wheelEntries = getActiveWheelEntrys();

    const palettes = {
        classic: i => `hsl(${i * 360 / wheelEntries.length},70%,55%)`,
        cool: i => `hsl(${200 + i * 40 / wheelEntries.length},70%,55%)`,
        dark: i => `hsl(220,15%,${35 + i * 15 / wheelEntries.length}%)`,
        warm: i => `hsl(${20 + i * 40 / wheelEntries.length},75%,55%)`
    };

    const colorFn = palettes[settings.colorScheme] || palettes.classic;

    if (!wheelEntries.length) return;

    const totalWeight = getTotalWeight();

    const slicePerWeight = Math.PI * 2 / totalWeight;

    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(angle);

    let start = Math.PI * 2;

    wheelEntries.forEach((wheelEntry, i) => {

        const weight = wheelEntry["weight"];
        const text = wheelEntry["text"]

        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.arc(0,0,radius,start-slicePerWeight*weight,start);
        ctx.fillStyle = colorFn(i);
        ctx.fill();

        ctx.save();
        ctx.rotate(start - (slicePerWeight*weight)/2);

        let size = 22;
        ctx.font = `${size}px system-ui`;
        let textMeasure = ctx.measureText(text);
        const arcLength = (slicePerWeight*weight) * 325;
        while ((textMeasure.width > radius*0.55 || textMeasure.fontBoundingBoxAscent > arcLength) && size > 6) {
            size--;
            ctx.font = `${size}px system-ui`;
            textMeasure = ctx.measureText(text);
        }

        console.log(size);

        ctx.fillStyle = "#111";
        if (size > 18) {
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.translate(radius*0.6,0);
        } else {
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            ctx.translate(radius*0.99,0);
        }
    
        
        ctx.fillText(text,0,0);

        ctx.restore();

        start -= slicePerWeight*weight;
    });

    ctx.restore();
}

/* ---------------- Spin ---------------- */

function spin() {
    if (spinning) return;

    spinning = true;
    spinSound.currentTime = 0; // start from beginning
    spinSound.play();

    // Decide the winner (to make sure it's fully random each time)
    const winner = pullWeightedWheelEntry();

    const slicePerWeight = Math.PI * 2 / getTotalWeight();
    const currentWeightPos = (angle % (2*Math.PI)) / slicePerWeight;

    const start = angle % (2 * Math.PI);
    let total =
        (winner["weight"] * slicePerWeight) - start +
        2*Math.PI * Math.floor(settings.spinStrength);
    if (total < 0) { total += 2*Math.PI; }

    const duration = settings.spinDuration * 1000;

    let startTime;

    function frame(t) {
        if (!startTime) startTime = t;

        const p = Math.min((t-startTime)/duration,1);
        angle = start + total*(1-Math.pow(1-p,3));

        drawWheel();

        if (p < 1) requestAnimationFrame(frame);
        else {
            spinning = false;
            spinSound.pause();
            victorySound.currentTime = 0;
            victorySound.play();
            showWinner(winner["wheelEntry"]);
        }
    }

    requestAnimationFrame(frame);
}

function getPointerWheelEntry() {
    const wheelEntries = getActiveWheelEntrys();
    const slicePerWeight = Math.PI * 2 / getTotalWeight();
    let currentWeightPos = (angle % (2*Math.PI)) / slicePerWeight;
    console.log(currentWeightPos);
    for (const wheelEntry of wheelEntries) {
        currentWeightPos -= wheelEntry["weight"];
        if (currentWeightPos <= 0) {
            console.log(wheelEntry);
            return;
        }
    }
}

function pullWeightedWheelEntry() {
    const wheelEntries = getActiveWheelEntrys();

    const totalWeight = getTotalWeight();

    const winningWeight = totalWeight * Math.random();
    let tempWeight = winningWeight;

    for (const wheelEntry of wheelEntries) {
        tempWeight -= wheelEntry["weight"];
        if (tempWeight <= 0) {
            return {weight: winningWeight, wheelEntry: wheelEntry};
        }
    }
}

function showWinner(winningWheelEntry) {
    winnerText.textContent = winningWheelEntry["text"];
    modal.classList.remove("hidden");
}

closeModalBtn.onclick = () => {
    modal.classList.add("hidden");
};

settingsBtn.onclick = () => {
    settingsModal.classList.remove("hidden");

    spinStrengthSlider.value = settings.spinStrength;
    spinStrengthNumber.value = settings.spinStrength;

    spinDurationSlider.value = settings.spinDuration;
    spinDurationNumber.value = settings.spinDuration;

    colorSchemeSelect.value = settings.colorScheme;
    spinSoundSelect.value = settings.spinSound;
    victorySoundSelect.value = settings.victorySound;
};

closeSettingsBtn.onclick = () => {
    settingsModal.classList.add("hidden");
};

canvas.onclick = spin;
spinBtn.onclick = spin;

/* ---------------- Import / Export ---------------- */

exportBtn.onclick = () => {
    const blob = new Blob(
        [JSON.stringify(getWheelData(), null, 2)],
        { type: "application/json" }
    );

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "wheel.json";
    a.click();

    URL.revokeObjectURL(a.href);

    showCard("Exported!", 3);
};

importBtn.onclick = () => importFile.click();

importFile.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            loadWheelData(data); // use the proper loader
            showCard(`Imported ${file.name}`, 3);
        } catch(err) {
            console.error(err);
            showCard("Failed to import file", 3);
        }
    };

    reader.readAsText(file);
};

copyBtn.onclick = () => {
    navigator.clipboard.writeText(JSON.stringify(wheelEntries));
    showCard("Copied JSON 👍", 2);
};

function saveAs() {
    saveNameInput.value = currentWheel || "";
    saveModal.classList.remove("hidden");
    saveNameInput.focus();
}

confirmSaveAsBtn.onclick = () => {
    const name = saveNameInput.value.trim();
    if (!name) return;

    const wheels = getWheels();

    wheels[name] = getWheelData();

    currentWheel = name;
    setWheels(wheels);

    saveModal.classList.add("hidden");
    showCard("Saved Successfully!", 4);
};

cancelSaveAsBtn.onclick = () => saveModal.classList.add("hidden");

saveWheelBtn.onclick = () => {
    if (currentWheel == null) {
        saveAs();
        return;
    }

    const wheels = getWheels();
    wheels[currentWheel] = getWheelData();

    showCard("Saved!", 2)

    setWheels(wheels);
};

saveAsWheelBtn.onclick = () => {
    saveAs();
};

loadWheelBtn.onclick = () => {
    loadModal.classList.remove("hidden");
    rebuildLoadMenu();
};

function rebuildLoadMenu() {
    loadList.innerHTML = "";

    const wheels = getWheels();

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
            loadWheel(name);
            loadModal.classList.add("hidden");
            showCard("Wheel Loaded", 3);
        };

        const delBtn = document.createElement("button");
        delBtn.className = "deleteBtn";
        delBtn.textContent = "Delete";
        delBtn.onclick = () => {
            if (!confirm(`Delete "${name}"?`)) return;

            const wheels = getWheels();
            delete wheels[name];
            setWheels(wheels);

            rebuildLoadMenu();
            showCard("Deleted", 3);
        };

        btns.append(loadBtn, delBtn);
        row.append(title, btns);
        loadList.append(row);
    });
}

function loadWheel(name) {
    const wheels = getWheels();
    if (!wheels[name]) {
        showCard(`Wheel "${name}" not found!`, 3);
        return;
    }

    currentWheel = name;
    loadWheelData(wheels[name]);
    showCard(`Wheel "${name}" loaded!`, 3);
}

newWheelBtn.onclick = () => {
    loadWheelData({}); 
    showCard("Made New Wheel!", 2);
}

/* ------------ WHEEL SETTINGS ------------ */
function applyWheelSize(size) {
    canvas.width = size;
    canvas.height = size;

    document.querySelector(".wheel-wrapper").style.width = size + "px";
    document.querySelector(".wheel-wrapper").style.height = size + "px";

    radius = size / 2;

    drawWheel();
}

function syncSpinStrength(val) {
    settings.spinStrength = +val;
    spinStrengthSlider.value = val;
    spinStrengthNumber.value = val;
    saveState();
}

spinStrengthSlider.oninput = e =>
    syncSpinStrength(e.target.value);

spinStrengthNumber.oninput = e =>
    syncSpinStrength(e.target.value);


function syncSpinDuration(val) {
    settings.spinDuration = +val;
    spinDurationSlider.value = val;
    spinDurationNumber.value = val;
    saveState();
}

spinDurationSlider.oninput = e =>
    syncSpinDuration(e.target.value);

spinDurationNumber.oninput = e =>
    syncSpinDuration(e.target.value);

colorSchemeSelect.onchange = e => {
    settings.colorScheme = e.target.value;
    drawWheel();
};

spinSoundSelect.onchange = e => {
    settings.spinSound = e.target.value;
    spinSound.pause();
    spinSound = new Audio(spinSounds[settings.spinSound]);
    spinSound.loop = true;
    spinSound.volume = 0.1;
}

victorySoundSelect.onchange = e => {
    settings.victorySound = e.target.value;
    victorySound.pause();
    victorySound = new Audio(victorySounds[settings.victorySound]);
    victorySound.volume = 0.2;
}


/* ------------- Utilities ------------- */
const cardContainer = document.getElementById("cardContainer");

function showCard(msg, seconds = 3) {
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

function getWheels() {
    return JSON.parse(localStorage.getItem("savedWheels") || "{}");
}

function setWheels(b) {
    localStorage.setItem("savedWheels", JSON.stringify(b));
}

function saveState() {
    localStorage.setItem(
        "wheelState",
        JSON.stringify(getWheelData())
    );
}

function loadState() {
    const saved = localStorage.getItem("wheelState");
    if (saved) {
        loadWheelData(JSON.parse(saved));
    }
}

function getWheelData() {
    return {
        wheelEntries,
        enabledTags: [...enabledTags],
        knownTags: [...knownTags],
        settings
    };
}

function loadWheelData(data) {
    wheelEntries = data.wheelEntries || [{ tags: "fruit", weight: 1, text: "Apple" }];
    enabledTags = new Set(data.enabledTags || []);
    knownTags = new Set(data.knownTags || []);
    settings = { ...settings, ...(data.settings || {}) };

    spinStrengthSlider.value = settings.spinStrength;
    spinStrengthNumber.value = settings.spinStrength;

    spinDurationSlider.value = settings.spinDuration;
    spinDurationNumber.value = settings.spinDuration;

    colorSchemeSelect.value = settings.colorScheme;
    spinSoundSelect.value = settings.spinSound;
    victorySoundSelect.value = settings.victorySound;

    rebuildTable();
    drawWheel();
}


/* ---------------- Init ---------------- */

document.addEventListener("DOMContentLoaded", () => {
    loadState();

    if (!wheelEntries.length) {
        addWheelEntry({ tags: "fruit", weight: 1, text: "Apple" });
        addWheelEntry({ tags: "fruit", weight: 1, text: "Banana" });
    } else {
        rebuildTable();
    }
});
