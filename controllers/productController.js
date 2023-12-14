const fs = require("fs");
const productModel = require("../models/product_schema");
const promotionalModel = require("../models/promotional_schema");
const ProductJson = require("../utils/productJson");
const PromotionalCron = require("../utils/promotionalCron");
const shopify = require("../utils/shopifyNode");
const createCollection = require("../utils/createCollection");
const errorHandler = require("../utils/errorHandler");
const productLogGenerator = require("../utils/logGenerator");
const cronConfig = require("../models/cronConfig");

const GetImage = require("../utils/getImage");

const createProductToShopify = async (scanCode, dirPath, apiUpdate = false) => {
    try {
        let codes = scanCode.map(code => {
            return {
                scanCodes: code,
            }
        });

        const productsData = await productModel.findOne({ "$or": codes });
        const { isUploadShopify, shopifyProduct, image, isPromotionalPrice, department } = productsData;
        const data = new ProductJson(productsData).productJson(); //Return product json (Folder - util)

        if (data.images[0].attachment == '') {
            if (apiUpdate === true) {

                const apiResponse = await new GetImage(codes).getProductImage();

                if (apiResponse) {
                    delete data.images[0].attachment;
                    if (apiResponse.imageUrl) {
                        data.images[0].src = apiResponse.imageUrl;
                        data.title = apiResponse.name;
                        if (!(apiResponse.description.includes('No description found'))) {
                            data.body_html = apiResponse.description;
                        }
                    }


                } else {
                    delete data.images[0].attachment;
                    data.status = 'draft';
                    data.images[0].src = "https://cdn.shopify.com/s/files/1/0679/2491/8554/files/no-photo.png?v=1679032742";
                }

            } else {
                data.status = 'draft';
                data.images[0].src = "https://cdn.shopify.com/s/files/1/0679/2491/8554/files/no-photo.png?v=1679032742";
            }

        } else {

            if (apiUpdate === true) {
                const apiResponse = await new GetImage(codes).getProductImage();
                if (apiResponse) {
                    data.title = apiResponse.name;
                    if (!(apiResponse.description.includes('No description found'))) {
                        data.body_html = apiResponse.description;
                    }
                }
            }

        }

        new createCollection().createCollectionToDB(department); //collection create

        let addProduct = "";
        if (isUploadShopify === true) {
            if (typeof image !== "undefined") delete data.images;
            addProduct = await shopify.product.update(shopifyProduct.productId, data);
            productLogGenerator("../log/product/shopify", `${addProduct.id}.log`, `Product Updated in Shopify \n${JSON.stringify(addProduct)}\n\n`);
        }
        else {
            addProduct = await shopify.product.create(data);
            productLogGenerator("../log/product/shopify", `${addProduct.id}.log`, `Product create in Shopify \n${JSON.stringify(addProduct)}\n\n`);
        }

        const productData = addProduct;
        const updateSchema = await productModel.findOneAndUpdate({ scanCodes: productData.variants[0].barcode }, {
            shopifyProduct: {
                productId: productData.id,
                createdAt: productData.created_at,
                updatedAt: productData.updated_at
            },
            isUploadShopify: true
        }, { new: true });

        await promotionalModel.findOneAndUpdate({ product: updateSchema._id }, { productId: productData.id });

        // (typeof image !== "undefined") ? fs.renameSync("".concat(dirPath, `/${image}`), "".concat(dirPath, `/${image}.done`)) : '';
        (isPromotionalPrice === true) ? new PromotionalCron(productData.variants[0].barcode).endDate() : '';

    } catch (error) {
        console.log(error);
        errorHandler(error);
    }
}


exports.insertData = async (data, dirPath, filename) => {
    try {
        const currentDataLength = data.length;
        data.forEach(async (ele, i) => {

            let codes = ele.scanCodes.map(code => {
                return {
                    scanCodes: code,
                }
            })

            const findUpdate = await productModel.findOneAndUpdate({ "$or": codes }, ele, { new: true });
            if (findUpdate !== null) {
                if (findUpdate.isPromotionalPrice === true) {
                    const updatedPromotionalModel = await promotionalModel.findOneAndUpdate({ product: findUpdate._id }, { product: findUpdate._id, promotionalPrice: findUpdate.promotionalPrice })
                    if (updatedPromotionalModel === null) {
                        await promotionalModel.create({ product: findUpdate._id, promotionalPrice: findUpdate.promotionalPrice })
                    }
                }
                productLogGenerator("../log/product/DB", `${findUpdate._id}.log`, `Product Updated in DB \n${JSON.stringify(findUpdate)}\n\n`);
                // await createProductToShopify(findUpdate.scanCodes, dirPath);
            }

            if (findUpdate === null) {

                const newlyCreated = await productModel.create(ele);
                if (newlyCreated.isPromotionalPrice === true) {
                    await promotionalModel.create({ product: newlyCreated._id, promotionalPrice: newlyCreated.promotionalPrice })
                }
                productLogGenerator("../log/product/DB", `${newlyCreated._id}.log`, `New Product Created In DB\n${JSON.stringify(newlyCreated)}\n\n`);
                // await createProductToShopify(newlyCreated.scanCodes, dirPath);
            }

            if (currentDataLength - 1 === i) {
                fs.renameSync("".concat(dirPath, `/${filename}`), "".concat(dirPath, `/${filename}.done`));
            }
        });
    } catch (error) {
        console.log(error);
        errorHandler(error);
    }
}


module.exports.createProductByCron = async () => {

    const configData = await cronConfig.findOne({ cronType: 'createProductByCron' });
    let limit = 35;
    let offset;

    if (configData) {
        limit = configData.limit;
        offset = configData.offset;
    } else {
        offset = 0;
        await cronConfig.create({ limit: limit, offset: offset, cronType: 'createProductByCron' })
    }
    const products = await productModel.find({ isUploadShopify: false }).limit(limit).skip(offset);

    if (products.length > 0) {
        offset += limit;
        if (configData) {
            configData.offset = offset;
            configData.save();
        } else {
            await cronConfig.findOneAndUpdate({ cronType: 'createProductByCron' }, { offset: offset });
        }

    } else {
        configData.offset = 0;
        configData.save();
    }

    const arrRes = [];
    for (let i = 0; i < products.length; i++) {

        console.log(products[i].scanCodes);
        arrRes.push(products[i].scanCodes);
        await createProductToShopify(products[i].scanCodes, '')

    }

    return arrRes;

}

module.exports.updateProductByUpc = async () => {


    const configData = await cronConfig.findOne({ cronType: 'updateByApi' });
    let limit = 10;
    let offset;

    if (configData) {
        limit = configData.limit;
        offset = configData.offset;
    } else {
        offset = 0;
        await cronConfig.create({ limit: limit, offset: offset, cronType: 'updateByApi' })
    }
    const products = await productModel.find({ isUploadShopify: true }).limit(limit).skip(offset);

    if (products.length > 0) {
        offset += limit;
        if (configData) {
            configData.offset = offset;
            configData.save();
        } else {
            await cronConfig.findOneAndUpdate({ cronType: 'updateByApi' }, { offset: offset });
        }

    } else {
        configData.offset = 0;
        configData.save();
    }

    const arrRes = [];
    for (let i = 0; i < products.length; i++) {

        console.log(products[i].scanCodes);
        arrRes.push(products[i].scanCodes);
        await createProductToShopify(products[i].scanCodes, '', true)

    }

    return arrRes;
}