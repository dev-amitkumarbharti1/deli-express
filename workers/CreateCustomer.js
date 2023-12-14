const { Worker, isMainThread, parentPort } = require('worker_threads');
const { connect, close } = require("../utils/workerDbConnection");
const { createCustomerByCron } = require("../controllers/cronController");

// if (!isMainThread) {



// }

connect();
async function UploadCustomer() {
    try {
        const response = await createCustomerByCron();
        console.log(response);
        if (response) {
            // close();
        }

    } catch (e) {
        console.log(e);
        // close();
    }
}

UploadCustomer();


