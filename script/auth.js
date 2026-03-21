// @ts-check

import { getSavedWheels, setSavedWheels, showCard } from "./main";


/** @type {string} The name of the file to be stored in the drive */
const fileName = "wheel-of-doom-data.json";


/** @type {string} The ID for users to interface with my API, which interfaces with Google. */
const CLIENT_ID = "35810980246-nusnbvs7f77dfrmfdqogt56eiggeh7eb.apps.googleusercontent.com";
/** @type {string|null} The access token of the user to be set by authenticate() */
let accessToken = null;


// @ts-ignore I'm not dealing with typescript nonsense
const tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    // Drive.file means this program can only access files they create
    scope: "https://www.googleapis.com/auth/drive.file",
    // @ts-ignore
    callback: (response) => {
        accessToken = response.access_token;
        localStorage.setItem("drive-access-token", accessToken || "");
    },
});

authenticate();


/**
 * Attempts to authenticate with the user's Google Drive
 */
function authenticate() {
    const savedToken = localStorage.getItem("drive-access-token");
    if (savedToken) { accessToken = savedToken; return; }
    tokenClient.requestAccessToken();
}


/**
 * Refreshes the access token
 */
function refreshToken() {
    tokenClient.requestAccessToken();
    showCard("Refreshed authentication. Try again.", 2);
}


/**
 * Overwrites the given file ID in the Google Drive
 * @param {Object} fileId The file ID to overwrite
 * @param {Object} jsonData The JSON data to place in the file
 * @returns 
 */
async function overwriteFile(fileId, jsonData) {
  const file = new Blob([JSON.stringify(jsonData)], {
    type: "application/json",
  });

  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: file,
    }
  );

  return res.json();
}


/**
 * Uploads the given JSON data to the Google Drive
 * @param {Object|null} fileID The file ID of the already existing file (if it exists)
 * @param {Object} jsonData The JSON data to upload
 */
async function uploadFile(fileID, jsonData) {
    if (accessToken == null) {
        console.warn("Failed to upload data to the drive because accessToken is null.");
        return;
    }
    if (fileID) {
        // @ts-ignore Doesn't know that the id field exists
        await overwriteFile(fileID.id, jsonData);
        return;
    }
    // Setup the data to upload
    const metadata = {
        name: fileName,
        mimeType: "application/json",
    };
    const file = new Blob([JSON.stringify(jsonData)], {
        type: "application/json",
    });

    const form = new FormData();
    form.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append("file", file);

    // Send the data to the google API
    const res = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: form,
        }
    );

    const data = await res.json();
    if (data.hasOwnProperty("error")) {
        refreshToken();
    }
    console.log("Saved data:");
    console.log(data);
}


/**
 * Finds a file in the drive with the given name
 * @param {string} name The name of the file to look for
 * @returns {Promise<Object|null>} The first match (or null if it doesn't exist)
 */
async function findFile(name) {
    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${name}' and trashed=false`,
        {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        }
    );

    const data = await res.json();
    if (data.hasOwnProperty("error")) {
        refreshToken();
    }
    return data.files?.[0]; // first match
}


/**
 * Reads the text in the given file
 * @param {Object} fileId The file ID (as given by Google Drive through findFile)
 * @returns {Promise<Object>} The text stored in the file (as a JSON element)
 */
async function readFile(fileId) {
    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        }
    );

    const text = await res.text(); // since it's JSON
    return JSON.parse(text);
}


async function _loadWheelsFromDrive() {
    const file = await findFile(fileName);

    if (!file) {
        showCard("No saved file found.");
        return;
    }

    // @ts-ignore
    const data = await readFile(file.id);
    // @ts-ignore
    setSavedWheels(data["wheels"]);
}


/**
 * Loads all wheels saved to the Google Drive (if any)
 */
export function loadWheelsFromDrive() {
    _loadWheelsFromDrive().then(() => { showCard("Loaded from Drive!", 3); })
}


/**
 * Saves all the wheels to the Google Drive
 */
export function saveWheelsToDrive() {
    authenticate();
    showCard("Saving to Drive...", 2);
    findFile(fileName).then(
        (id) => { uploadFile(id, {wheels: getSavedWheels()}).then(
            () => { showCard("Saved to Drive!", 3); }
        )}
    );
}