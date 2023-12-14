const { Worker, isMainThread, parentPort } = require('worker_threads');
const { connect, close } = require("../utils/workerDbConnection");
const { readFileCreateCustomer } = require("../controllers/customerController");

if (!isMainThread) {
    connect();

    async function ReadCustomer() {

        try {

            await readFileCreateCustomer();//  const response =
            //parentPort.postMessage({ message: response, success: true });
            close();

        } catch (e) {

            //parentPort.postMessage({ error: e.message, success: false });
            close();

        } finally {
            close();
        }

    }

    ReadCustomer();

}



