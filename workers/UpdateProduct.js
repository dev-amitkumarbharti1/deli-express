const { Worker, isMainThread, parentPort } = require('worker_threads');
const productController = require("../controllers/productController");
const { connect, close } = require("../utils/workerDbConnection");

if (!isMainThread) {
    connect();

    async function UpdateProduct() {

        try {
            const response = await productController.updateProductByUpc();
            console.log(response);

        } catch (e) {
            console.log(e);
            parentPort.postMessage({ error: e, success: false });
            // close();
        } finally {
            close();
        }

    }

    UpdateProduct();

}


