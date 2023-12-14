const { Worker } = require('node:worker_threads');


module.exports.runCustomerImport = async (workerData) => {

    return new Promise((resolve, reject) => {
        const worker = new Worker("./workers/CreateCustomer.js", { workerData: workerData });
        worker.on('message', (message) => {
            resolve(message);
        });
        worker.on('error', (error) => {
            reject(error);
        });
        worker.on('exit', (code) => {
            if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
        })
    })
}


module.exports.runProductUpdate = async (workerData) => {

    return new Promise((resolve, reject) => {
        const worker = new Worker("./workers/UpdateProduct.js", { workerData: workerData });
        worker.on('message', (message) => {
            resolve(message);
        });
        worker.on('error', (error) => {
            reject(error);
        });
        worker.on('exit', (code) => {
            if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
        })
    })
}

module.exports.readCustomer = async (workerData) => {

    return new Promise((resolve, reject) => {
        const worker = new Worker("./workers/ReadCustomer.js", { workerData: workerData });
        worker.on('message', (message) => {
            resolve(message);
        });
        worker.on('error', (error) => {
            reject(error);
        });
        worker.on('exit', (code) => {
            if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
        })
    })
}

module.exports.createProductByFile = async (workerData) => {
    return new Promise((resolve, reject) => {
        const worker = new Worker("./workers/CreateProductByFile.js", { workerData: workerData });
        worker.on('message', (message) => {
            resolve(message);
        });
        worker.on('error', (error) => {
            reject(error);
        });
        worker.on('exit', (code) => {
            if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
        })
    })
}