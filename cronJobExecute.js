const cron = require("node-cron");
const CreateCollection = require("./utils/createCollection");
const collection = new CreateCollection();


const cronController = require("./controllers/cronController");
const productController = require("./controllers/productController");

const { runCustomerImport, runProductUpdate, readCustomer, createProductByFile } = require("./utils/worker");

const { readFileCreateCustomer } = require("./controllers/customerController");
const { createCustomerByCron } = require("./controllers/cronController");


//this cron for creating collection
cron.schedule('00 */7 * * *', async () => {
    console.log('Collection Cron Running...');
    await collection.createCollectionToShopify();
});


cron.schedule('00 */2 * * *', async () => {

    console.log('reading customer file and adding to db');

    const res = await readCustomer("Read Customer file");
    console.log(res);
    //  await readFileCreateCustomer();

});

//this cron run for remove product file and images 00 00 * * 0
cron.schedule('00 */1 * * *', () => {
    cronController.removeFiles();
})

//this cron for creating product to db and shopify run every 6 hours 00 */6 * * *
const crondata = cron.schedule('*/15 * * * *', async () => {
    // console.log('Product Create and Update Cron Running...');
    await cronController.readFileCreateProduct();
    // await createProductByFile("createProductByFile");
});

cron.schedule('*/10 * * * *', async () => {
    console.log('creating customer in batch every 3 minute.');
    const res=await createCustomerByCron();
    //const res = await runCustomerImport("import customer");
    console.log(res);
});

cron.schedule('*/4 * * * *', async () => {
    console.log('Lookup Api running.');
    const response =await productController.updateProductByUpc();
   // const response = await runProductUpdate("run");
    console.log(response);
});

cron.schedule('*/1 * * * *', async () => {
    console.log('creating product to shopify.');
    //await productController.updateProductByUpc();
    const response = await productController.createProductByCron();
    console.log(response);
});

module.exports = crondata