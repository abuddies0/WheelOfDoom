const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");

const tableBody = document.querySelector("#entryTable tbody");
const tagFiltersDiv = document.getElementById("tagFilters");

const saveBoardBtn = document.getElementById("saveBoardBtn");
const saveAsBoardBtn = document.getElementById("saveAsBoardBtn");
const loadBoardBtn = document.getElementById("loadBoardBtn");
const copyBtn = document.getElementById("copyBtn");

const importFile = document.getElementById("importFile");

const modal = document.getElementById("winnerModal");
const winnerText = document.getElementById("winnerText");
const closeModalBtn = document.getElementById("closeModalBtn");

const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");

// Wheel Settings
const spinStrengthSlider = document.getElementById("spinStrengthSlider");
const spinStrengthNumber = document.getElementById("spinStrengthNumber");
const spinDurationSlider = document.getElementById("spinDurationSlider");
const spinDurationNumber = document.getElementById("spinDurationNumber");
const colorSchemeSelect = document.getElementById("colorSchemeSelect");
let settings = {
    spinStrength: 12,
    spinDuration: 3.5, // seconds
    colorScheme: "classic"
};

let currentBoard = null;

let radius = canvas.width / 2;

let angle = 0;
let spinning = false;

let entries = [];
let enabledTags = new Set();


/* ---------------- Persistence ---------------- */

function saveState() {
    localStorage.setItem("wheelState", JSON.stringify(entries));
}

function loadState() {
    const saved = localStorage.getItem("wheelState");
    if (saved) entries = JSON.parse(saved);
}

/* ---------------- Rows ---------------- */

function addEntry(data = { tags: "", weight: 1, text: "" }) {
    entries.push(data);
    rebuildTable();
    // Returns the newest entry (the last one)
    return tableBody.lastChild;
}

function rebuildTable() {
    tableBody.innerHTML = "";

    entries.forEach((entry, i) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td><input value="${entry.tags}"></td>
            <td><input type="number" min="1" value="${entry.weight}"></td>
            <td><input value="${entry.text}"></td>
            <td><button data-i="${i}">✕</button></td>
        `;

        tr.querySelectorAll("input").forEach(inp => {
            inp.oninput = () => {
                entry.tags = tr.children[0].firstChild.value;
                entry.weight = +tr.children[1].firstChild.value || 1;
                entry.text = tr.children[2].firstChild.value;

                updateTagFilters();
                saveState();
                drawWheel();
            };
        });

        tr.querySelector("button").onclick = () => {
            entries.splice(i, 1);
            rebuildTable();
        };

        const entryInput = tr.children[2].firstChild;

        entryInput.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                e.preventDefault();
                const newEntry = addEntry();
                newEntry.childNodes[5].firstChild.focus();
            }
        });

        tableBody.appendChild(tr);
    });

    updateTagFilters();
    saveState();
    drawWheel();
}

/* ---------------- Tags ---------------- */

function updateTagFilters() {
    const allTags = new Set();

    entries.forEach(r =>
        r.tags.split(",").map(t => t.trim()).filter(Boolean)
            .forEach(t => allTags.add(t))
    );

    tagFiltersDiv.innerHTML = "";

    allTags.forEach(tag => {
        const div = document.createElement("div");
        div.className = "tagToggle active";
        div.textContent = tag;

        div.onclick = () => {
            div.classList.toggle("active");

            if (enabledTags.has(tag)) enabledTags.delete(tag);
            else enabledTags.add(tag);

            drawWheel();
        };

        enabledTags.add(tag);
        tagFiltersDiv.appendChild(div);
    });
}

/* ---------------- Active Entries ---------------- */

function getActiveEntries() {
    const expanded = [];

    entries.forEach(entry => {
        const tags = entry.tags.split(",").map(t => t.trim());

        if (
            tags.length &&
            !tags.some(t => enabledTags.has(t))
        ) return;

        for (let i = 0; i < entry.weight; i++) {
            expanded.push(entry.text);
        }
    });

    return expanded;
}

/* ---------------- Drawing ---------------- */

function drawWheel() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    const entries = getActiveEntries();

    const palettes = {
        classic: i => `hsl(${i * 360 / entries.length},70%,55%)`,
        cool: i => `hsl(${200 + i * 40 / entries.length},70%,55%)`,
        dark: i => `hsl(220,15%,${35 + i * 15 / entries.length}%)`,
        warm: i => `hsl(${20 + i * 40 / entries.length},75%,55%)`
    };

    const colorFn = palettes[settings.colorScheme] || palettes.classic;

    if (!entries.length) return;

    const slice = Math.PI * 2 / entries.length;

    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(angle);

    entries.forEach((text, i) => {
        const start = i * slice;

        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.arc(0,0,radius,start,start+slice);
        ctx.fillStyle = colorFn(i);
        ctx.fill();

        ctx.save();
        ctx.rotate(start + slice/2);

        let size = 22;
        ctx.font = `${size}px system-ui`;
        while (ctx.measureText(text).width > radius*0.55 && size > 12) {
            size--;
            ctx.font = `${size}px system-ui`;
        }

        ctx.fillStyle = "#111";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.translate(radius*0.6,0);
        ctx.fillText(text,0,0);

        ctx.restore();
    });

    ctx.restore();
}

/* ---------------- Spin ---------------- */

function spin() {
    if (spinning) return;

    spinning = true;

    const start = angle;
    const total =
        Math.random() * Math.PI * settings.spinStrength +
        Math.PI * settings.spinStrength;

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
            showWinner();
        }
    }

    requestAnimationFrame(frame);
}

function showWinner() {
    const entries = getActiveEntries();
    const slice = Math.PI * 2 / entries.length;

    const normalized =
        (2 * Math.PI - (angle % (2 * Math.PI))) %
        (2 * Math.PI);

    const index = Math.floor(normalized / slice);

    winnerText.textContent = entries[index];
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
};

closeSettingsBtn.onclick = () => {
    settingsModal.classList.add("hidden");
};

canvas.onclick = spin;
spinBtn.onclick = spin;

/* ---------------- Import / Export ---------------- */

exportBtn.onclick = () => {
    const blob = new Blob(
        [JSON.stringify(entries, null, 2)],
        { type: "application/json" }
    );

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "wheel-board.json";
    a.click();

    URL.revokeObjectURL(a.href);
};

importBtn.onclick = () => importFile.click();

importFile.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        entries = JSON.parse(reader.result);
        rebuildTable();
    };

    reader.readAsText(file);
};

copyBtn.onclick = () => {
    navigator.clipboard.writeText(JSON.stringify(entries));
    alert("Copied JSON 👍");
};

function saveAs() {
    const name = prompt("Save board as:");
    if (!name) return;

    const boards = getBoards();
    boards[name] = entries;

    currentBoard = name;

    setBoards(boards);
}

saveBoardBtn.onclick = () => {
    if (currentBoard == null) saveAs();

    const boards = getBoards();
    boards[currentBoard] = entries;

    setBoards(boards);
};

saveAsBoardBtn.onclick = () => {
    saveAs();
};

loadBoardBtn.onclick = () => {
    const boards = getBoards();
    const names = Object.keys(boards);

    if (!names.length) return alert("No saved boards!");

    const pick = prompt(
        "Available:\n" + names.join("\n")
    );

    if (!pick || !boards[pick]) return;

    entries = boards[pick];

    currentBoard = pick;
    rebuildTable();
};

/* --------------- Settings -------------- */
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
}

spinStrengthSlider.oninput = e =>
    syncSpinStrength(e.target.value);

spinStrengthNumber.oninput = e =>
    syncSpinStrength(e.target.value);



function syncSpinDuration(val) {
    settings.spinDuration = +val;
    spinDurationSlider.value = val;
    spinDurationNumber.value = val;
}

spinDurationSlider.oninput = e =>
    syncSpinDuration(e.target.value);

spinDurationNumber.oninput = e =>
    syncSpinDuration(e.target.value);



colorSchemeSelect.onchange = e => {
    settings.colorScheme = e.target.value;
    drawWheel();
};

/* ------------ Local Cache ------------- */
function getBoards() {
    return JSON.parse(localStorage.getItem("savedBoards") || "{}");
}

function setBoards(b) {
    localStorage.setItem("savedBoards", JSON.stringify(b));
}

/* ---------------- Init ---------------- */

loadState();

if (!entries.length) {
    addEntry({ tags: "fruit", weight: 1, text: "Apple" });
    addEntry({ tags: "fruit", weight: 1, text: "Banana" });
} else rebuildTable();