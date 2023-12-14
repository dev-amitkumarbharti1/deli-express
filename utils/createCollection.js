
const collectionModel = require("../models/collection_schema");
const shopify = require("./shopifyNode");
const errorHandler = require("./errorHandler");
const productLogGenerator = require("./logGenerator"); 
class CreateCollection {

    createCollectionToDB(department) {
        try {
            const newData = {
                title: department
            };
            const filter = { title: newData.title };
            const update = newData;
            const options = { upsert: true, new: true };
            collectionModel.findOneAndUpdate(filter, update, options, (err, doc) => {
                if (err) {
                    errorHandler(err);
                } else {
                    productLogGenerator("../log/collection/DB", `${doc._id}.log`, `Collection Update and Create to DB\n ${JSON.stringify(doc)}\n\n`);
                }
            });
        } catch (error) {
            errorHandler(error);
        }
    }

    async createCollectionToShopify() {
        try {
            
            const notUploadedData = await collectionModel.find({
                isUploadedShopify: false
            });
    
            if (notUploadedData !== null) {
                notUploadedData.forEach(async ele => {
                    const departmentTitle = ele.title;
                    const title = departmentTitle.replace(/[0-9]/g, '').trim();
                    const splitTitle = (title.includes('/')) ? title.split("/")[1].trim() : title;
                    const collectionInfo = {
                        title: splitTitle,
                        rules: [
                            {
                                column: "tag",
                                relation: "equals",
                                condition: departmentTitle
                            }
                        ]
                    };
                    const collectionData = await shopify.smartCollection.create(collectionInfo);
                    await collectionModel.findOneAndUpdate({ title: departmentTitle }, {
                        collectionId: collectionData.id,
                        createdAt: collectionData.published_at,
                        updatedAt: collectionData.updated_at,
                        isUploadedShopify: true
                    })
                    productLogGenerator("../log/collection/shopify", `${collectionData.id}.log`, `Collection Update and Create to Shopify\n ${JSON.stringify(collectionData)}\n\n`);
                })
            }
        } catch (error) {
            errorHandler(error);
        }

    }

}


module.exports = CreateCollection;