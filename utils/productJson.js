const path = require("path");
const base64Img = require('base64-img');
const fs = require("fs");
const errorHandler = require("../utils/errorHandler");
class ProductJson {
    constructor(productsData) {
        this.productsData = productsData
    }

    productJson() {
        try {


            const { name, size, brand, department, discontinue, isWeightProduct, pricing, isPromotionalPrice, promotionalPrice, onHand, image, scanCodes } = this.productsData;
            const tags = (isWeightProduct === true) ? 'WeightProduct' : '';
            const options = [
                {
                    name: "Size",
                    values: [size]
                },
                {
                    name: "Level",
                    values: ["Level 1", "Level 2", "Level 3", "Level 4"]
                }
            ];

            let price = (isPromotionalPrice === true) ? promotionalPrice.pricing : pricing[0].priceLevel1;

            let price3 = (pricing[0].priceLevel3 == 0) ? (pricing[0].priceLevel2 == 0) ? price : pricing[0].priceLevel2 : pricing[0].priceLevel3;

            const variants = [
                {
                    option1: size,
                    option2: "Level 1",
                    price: (isPromotionalPrice === true) ? promotionalPrice.pricing : pricing[0].priceLevel1,
                    compare_at_price: (isPromotionalPrice === true) ? pricing[0].priceLevel1 : null,
                    inventory_quantity: onHand,
                    barcode: scanCodes[0],
                    inventory_management: "shopify"
                },
                {
                    option1: size,
                    option2: "Level 2",
                    price: (pricing[0].priceLevel2 == 0) ? price : pricing[0].priceLevel2,
                    inventory_quantity: onHand,
                    inventory_management: "shopify"
                },
                {
                    option1: size,
                    option2: "Level 3",
                    price: (pricing[0].priceLevel3 == 0) ? (pricing[0].priceLevel2 == 0) ? price : pricing[0].priceLevel2 : pricing[0].priceLevel3,
                    inventory_quantity: onHand,
                    inventory_management: "shopify"
                },
                {
                    option1: size,
                    option2: "Level 4",
                    price: (pricing[0].priceLevel4 == 0) ? price3 : pricing[0].priceLevel4,
                    inventory_quantity: onHand,
                    inventory_management: "shopify"
                }
            ];

            const data = {
                title: name,
                body_html: `<p>Title : ${name}</p><br/><p>Size: ${size}</p>`,
                vendor: brand,
                tags: `${tags}, ${department}`,
                status: (discontinue === false) ? "active" : "draft",
                options: options,
                variants: variants,
                images: [
                    {
                        attachment: (typeof image !== "undefined") ?
                            (fs.existsSync(path.join(__dirname, `../${process.env.PATH_INVENTORY}/${image}`))) ? base64Img.base64Sync(path.join(__dirname, `../${process.env.PATH_INVENTORY}/${image}`)).split("base64,")[1] : ""
                            : ""
                    }
                ]

            }

            if (fs.existsSync(path.join(__dirname, `../${process.env.PATH_INVENTORY}/${image}`))) {

                if (typeof image !== "undefined") fs.renameSync(path.join(__dirname, `../${process.env.PATH_INVENTORY}/${image}`), path.join(__dirname, `../${process.env.PATH_INVENTORY}/${image}.done`));
            }


            return data;
        } catch (error) {
            console.error(error);
            errorHandler(error);
        }

    }
}

module.exports = ProductJson;