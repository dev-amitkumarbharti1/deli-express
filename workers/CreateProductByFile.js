const { Worker, isMainThread, parentPort } = require('worker_threads');
const { connect, close } = require("../utils/workerDbConnection");
const cronController = require("../controllers/cronController");

if (!isMainThread) {
    connect();

    async function readFileUploadItem() {

        try {

            await cronController.readFileCreateProduct();// const response =
            // parentPort.postMessage({ message: response, success: true });
            close();

        } catch (e) {

            // parentPort.postMessage({ error: e.message, success: false });
            close();

        }

    }

    readFileUploadItem();

}

