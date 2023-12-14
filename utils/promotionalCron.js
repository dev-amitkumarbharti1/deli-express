const cron = require("node-cron");
const productModel = require("../models/product_schema");
const promotionalModel = require("../models/promotional_schema");
const shopify = require("./shopifyNode");
const errorHandler = require("./errorHandler");
class PromotionalCron {
    constructor(code) {
        this.code = code;
    }

    async updatePromotionalPrice(productDBId, currentId, productShopifyId, pricing) {
        try {
            let variants = [];
            const updateDb = await productModel.findByIdAndUpdate(productDBId, {
                $set: {
                    isPromotionalPrice: false,
                    promotionalPrice: {}
                }
            })
            await promotionalModel.findByIdAndDelete(currentId);

            //get current product variant id and price
            const getProduct = await shopify.product.get(productShopifyId);
            getProduct.data.product.variants.forEach((variant, index) => {
                variants.push({
                    id: variant.id,
                    price: pricing[`priceLevel${index + 1}`]
                })
            })
            const updateObj = {
                product: {
                    variants: variants
                }
            }
            //update variant price in shopify
            const updateProduct = await shopify.product.update(productShopifyId, updateObj);
            // console.log(updateProduct);
        } catch (error) {
            errorHandler(error);
        }

    }

    async endDate() {
        try {
            const promotionalProduct = await productModel.findOne({ scanCodes: this.code }).populate('promotionalsData');
            const promotional = promotionalProduct.promotionalsData[0];
            const endDate = promotional.promotionalPrice.attribute[0].endDate;

            const pricing = promotionalProduct.pricing[0];
            const productDbID = promotional.product;
            const currentId = promotional._id;
            const productShopifyId = promotional.productId;

            const newEndDate = new Date(endDate);
            const scheduleDate = `${newEndDate.getMinutes()} ${newEndDate.getHours()} ${newEndDate.getDate()} ${newEndDate.getMonth() + 1} *`;

            const job = cron.schedule(scheduleDate, () => {
                this.updatePromotionalPrice(productDbID, currentId, productShopifyId, pricing);
                job.destroy();
            }, {
                scheduled: true
            });
        } catch (error) {
            errorHandler(error);
        }

    }

}

module.exports = PromotionalCron;