const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");

const tableBody = document.querySelector("#entryTable tbody");
const tagFiltersDiv = document.getElementById("tagFilters");

const saveBoardBtn = document.getElementById("saveBoardBtn");
const loadBoardBtn = document.getElementById("loadBoardBtn");
const copyBtn = document.getElementById("copyBtn");

const importFile = document.getElementById("importFile");

const modal = document.getElementById("winnerModal");
const winnerText = document.getElementById("winnerText");
const closeModalBtn = document.getElementById("closeModalBtn");

const radius = canvas.width / 2;

let angle = 0;
let spinning = false;

let rows = [];
let enabledTags = new Set();

/* ---------------- Persistence ---------------- */

function saveState() {
    localStorage.setItem("wheelState", JSON.stringify(rows));
}

function loadState() {
    const saved = localStorage.getItem("wheelState");
    if (saved) rows = JSON.parse(saved);
}

/* ---------------- Rows ---------------- */

function addRow(data = { tags: "", weight: 1, text: "" }) {
    rows.push(data);
    rebuildTable();
}

function rebuildTable() {
    tableBody.innerHTML = "";

    rows.forEach((row, i) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td><input value="${row.tags}"></td>
            <td><input type="number" min="1" value="${row.weight}"></td>
            <td><input value="${row.text}"></td>
            <td><button data-i="${i}">✕</button></td>
        `;

        tr.querySelectorAll("input").forEach(inp => {
            inp.oninput = () => {
                row.tags = tr.children[0].firstChild.value;
                row.weight = +tr.children[1].firstChild.value || 1;
                row.text = tr.children[2].firstChild.value;

                updateTagFilters();
                saveState();
                drawWheel();
            };
        });

        tr.querySelector("button").onclick = () => {
            rows.splice(i, 1);
            rebuildTable();
        };

        const entryInput = tr.children[2].firstChild;

        entryInput.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                e.preventDefault();
                addRow();
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

    rows.forEach(r =>
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

    rows.forEach(row => {
        const tags = row.tags.split(",").map(t => t.trim());

        if (
            tags.length &&
            !tags.some(t => enabledTags.has(t))
        ) return;

        for (let i = 0; i < row.weight; i++) {
            expanded.push(row.text);
        }
    });

    return expanded;
}

/* ---------------- Drawing ---------------- */

function drawWheel() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    const entries = getActiveEntries();
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
        ctx.fillStyle = `hsl(${i*360/entries.length},70%,55%)`;
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
    const total = Math.random()*Math.PI*4 + Math.PI*10;
    const duration = 3500;

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

canvas.onclick = spin;
spinBtn.onclick = spin;

/* ---------------- Import / Export ---------------- */

exportBtn.onclick = () => {
    const blob = new Blob(
        [JSON.stringify(rows, null, 2)],
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
        rows = JSON.parse(reader.result);
        rebuildTable();
    };

    reader.readAsText(file);
};

copyBtn.onclick = () => {
    navigator.clipboard.writeText(JSON.stringify(rows));
    alert("Copied JSON 👍");
};

saveBoardBtn.onclick = () => {
    const name = prompt("Save board as:");
    if (!name) return;

    const boards = getBoards();
    boards[name] = rows;

    setBoards(boards);
};

loadBoardBtn.onclick = () => {
    const boards = getBoards();
    const names = Object.keys(boards);

    if (!names.length) return alert("No saved boards!");

    const pick = prompt(
        "Available:\n" + names.join("\n")
    );

    if (!pick || !boards[pick]) return;

    rows = boards[pick];
    rebuildTable();
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

if (!rows.length) {
    addRow({ tags: "fruit", weight: 1, text: "Apple" });
    addRow({ tags: "fruit", weight: 1, text: "Banana" });
} else rebuildTable();