const indexedDB = 
    window.indexedDB ||
    window.mozIndexedDB || 
    window.webkitIndexedDB || 
    window.msIndexedDB;


if (!indexedDB) {
    console.error(`
        The current rowser doesn't support a stable version of IndexedDB. 
        Song importing and loading will not be available.`);
}

const DBConstants = {
    name: 'SongDatabase',
    songStore: 'songs',
    version: 3
}


// ---- Helpers ---- //


async function blobToArrayBuffer(blob) {
    try {
        return await blob.arrayBuffer()
    } catch (error) {
        console.error(error);
    }
}

function arrayBufferToBlob(arrayBuffer, type) {
    return new Blob([arrayBuffer], {type: type});
  }


// This is mainly to define the schema for song records in 
// an easily locatable place. 
function createNewRecord(songFile, arrayBuffer) {
    return {name: songFile.name, arrayBuffer: arrayBuffer, mimeType: songFile.type}
}


function handleDBOpenError(event) {
    console.error(event)
}

function handleDBUpgrade(event) {
    const db = event.target.result
    // db.deleteObjectStore(DBConstants.songStore)
    db.createObjectStore(DBConstants.songStore, {keyPath: 'name'})
}

function udpateRecord(objectStore, origRecord, newRecord) {
    origRecord.arrayBuffer = newRecord.arrayBuffer
    origRecord.mimeType = newRecord.mimeType
    const putRequest = objectStore.put(origRecord)
    putRequest.onsuccess = function() {
        console.log(
            'Original record', origRecord, 'successfully updated with', newRecord)
    }
    putRequest.onerror = function(error) {
        console.error(
            'Failed to update original record', origRecord, 'with new data', newRecord)
        console.error(error)
    }
}

function putNewRecord(objectStore, record) {
    const putRequest = objectStore.put(record)
    putRequest.onsuccess = function() {
        console.log('Successfully added new record', record)
    }
    putRequest.onerror = function(error) {
        console.error('Failed to add new record', record)
        console.error(error)
    }
}

function getURLFromRecord(record) {
    let blob = arrayBufferToBlob(record.arrayBuffer, record.mimeType)
    const URL = window.URL || window.webkitURL;
    return URL.createObjectURL(blob);
}


// ---- Public API ---- //


function importSongToDB(song) {
    const request = indexedDB.open(DBConstants.name, DBConstants.version);

    request.onerror = handleDBOpenError

    request.onupgradeneeded = handleDBUpgrade

    request.onsuccess = async function() {
        const db = request.result
        let arrayBuffer = await blobToArrayBuffer(song)
        let record = createNewRecord(song, arrayBuffer)
        const store = db.transaction([DBConstants.songStore], 'readwrite')
                        .objectStore(DBConstants.songStore)
        const query = store.get(song.name)
        query.onsuccess = function(event) {
            let songInDB = (query.result !== undefined)
            if (songInDB) { 
                udpateRecord(store, event.target.result, record)
            } else {
                putNewRecord(store, record)
            }
        }
    }
}

function getURLFromSongName(songName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DBConstants.name, DBConstants.version);
        request.onerror = handleDBOpenError
        request.onupgradeneeded = handleDBUpgrade
        request.onsuccess = function() {
            const db = request.result
            const store = db.transaction([DBConstants.songStore], 'readwrite')
                            .objectStore(DBConstants.songStore)
            const query = store.get(songName)
            query.onsuccess = function(event) {
                let songURL = getURLFromRecord(event.target.result)
                resolve(songURL)
            }
            query.onerror = function(error) {
                console.error(error)
                reject(error)
            }
        }
    })
}


function getAllImportedSongNames() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DBConstants.name, DBConstants.version);
        request.onerror = handleDBOpenError
        request.onupgradeneeded = handleDBUpgrade
        request.onsuccess = async function() {
            const db = request.result
            const store = db.transaction([DBConstants.songStore], 'readwrite')
                            .objectStore(DBConstants.songStore)
            const query = store.getAll()
            query.onsuccess = function(event) {
                resolve(query.result.map(songEntry => songEntry.name))
            }
            query.onerror = function(event) {
                console.error(event)
                reject(event)
            }
        }
    })
}


export {importSongToDB, getURLFromSongName, getAllImportedSongNames}