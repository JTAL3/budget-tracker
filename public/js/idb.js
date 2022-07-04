let db;

const request = indexedDB.open('cash', 1);

request.onupgradeneeded = function(event) {

    const db = event.target.result;

    db.createObjectStore("new_transaction", { autoIncrement: true });
};

request.onsuccess = function(event) {

    // when db is successfully created with its object store, save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run uploadTransaction() function to send all local db data to api
    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
};

function saveRecord(record) {

    const transaction = db.transaction(["new_transaction"], 'readwrite');

    const ObjectStore = transaction.objectStore("new_transaction");

    ObjectStore.add(record);
}

function uploadTransaction() {

    // open transaction
    const transaction = db.transaction(["new_transaction"], "readwrite");

    // access object store
    const ObjectStore = transaction.objectStore("new_transaction");

    // get all records from store and set to a variable
    const getAll = ObjectStore.getAll();

    getAll.onsuccess = function() {
        // send data to api
        if (getAll.result.length > 0) {
            fetch("/api/transaction", {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => 
                    {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }

                    const transaction = db.transaction(["new_transaction"], "readwrite");
                    const ObjectStore = transaction.objectStore("new_transaction");

                    // clear all items
                    ObjectStore.clear();
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }
}

// app online
window.addEventListener('online', uploadTransaction);