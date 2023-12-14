const express = require('express');
const router = express.Router();

const cronController = require("../controllers/cronController");

const productController = require("../controllers/productController");

const { runCustomerImport, runProductUpdate, readCustomer, createProductByFile } = require("../utils/worker");


router.get('/api/products', (req, res, next) => {
    cronController.readFileCreateProduct();

    //productController.CreateRemainingItems();
});

router.get('/api/remove-files', (req, res, next) => {
    cronController.removeFiles();

    //productController.CreateRemainingItems();
});

router.get('/api/update', async (req, res, next) => {
    //cronController.createCustomerByCron();

    const arr = await productController.updateProductByUpc();

    res.send({ data: arr });
});

router.get("/api/test", async (req, res, next) => {
    await cronController.readFileCreateProduct();
    //  await createProductByFile("create Product");
    // await runCustomerImport("import customer");
})


module.exports = router;