const path = require("path");
const fs = require("fs");

const CreateCollection = require("../utils/createCollection");
const errorHandler = require("../utils/errorHandler");
const logFileHandler = require("./logFileController");

const InventoryFile = require("../utils/inventoryFile");
const productController = require("./productController");

const cronConfig = require("../models/cronConfig");

const Customer = require("../models/customer");
const shopify = require("../utils/shopifyNode");


//Read file and create product to the shopify
module.exports.readFileCreateProduct = async () => {

    try {
        const dirPath = path.join(__dirname, '../' + process.env.PATH_INVENTORY);

        const { filename, JsonData } = new InventoryFile(dirPath).getFile();

        // console.log(JsonData.Items.Item);
        if (typeof JsonData !== "undefined") {
            const itemsData = JsonData.Items.Item;
            const items = (Array.isArray(itemsData)) ? itemsData : [itemsData];
            let data = [];
            if (items) {
                items.forEach(item => {

                    const { scancode, discontinued, taxExempt } = item._attributes;

                    //for the multiple scan code
                    const scanCodes = [scancode];
                    let isAlternateItem = false;
                    if (item.AlternateItems) {
                        isAlternateItem = true;
                        if (item.AlternateItems.AlternateItem.length == undefined) {
                            scanCodes.push(item.AlternateItems.AlternateItem._attributes.scancode);
                        } else {
                            item.AlternateItems.AlternateItem.forEach(alternateItem => {
                                scanCodes.push(alternateItem._attributes.scancode)
                            })
                        }

                    }

                    //for the powerfield
                    const powerField = [];
                    const objectEntries = Object.entries(item); //we have create array of array
                    objectEntries.forEach(e => {
                        if (e[0].includes('PowerField')) {
                            powerField.push({
                                [e[0]]: e[1]._text
                            })
                        }
                    });
                    const power = Object.fromEntries(powerField.flatMap(Object.entries));

                    console.log(item);
                    data.push({
                        scanCodes: scanCodes,
                        discontinue: discontinued,
                        taxExempt: taxExempt,
                        name: item.Name._text,
                        size: (item.Size) ? item.Size._text : 'one size',
                        brand: item.Brand._text,
                        department: item.Department._attributes.name,
                        weightUnit: item?.WeightUnit?._text,
                        onHand: (typeof item?.WeightUnit?._text !== "undefined") ? item.OnHand._text * 1000 : item.OnHand._text,
                        safetyStock: +item.SafetyStock._text,
                        location: item?.Location?._text,
                        isAlternateItem: isAlternateItem,
                        isPromotionalPrice: (typeof item.Pricing?.PromotionalPricing !== "undefined") ? true : false,
                        powerFields: [power],
                        image: item?.Image?._attributes?.filename,
                        pricing: [
                            {
                                priceLevel1: item.Pricing.Price[0]._attributes.price / item.Pricing.Price[0]._attributes.divider,
                                priceLevel2: item.Pricing.Price[1]._attributes.price / item.Pricing.Price[1]._attributes.divider,
                                priceLevel3: item.Pricing.Price[2]._attributes.price / item.Pricing.Price[2]._attributes.divider,
                                priceLevel4: item.Pricing.Price[3]._attributes.price / item.Pricing.Price[3]._attributes.divider,
                            }
                        ],
                        promotionalPrice: {
                            attribute: item.Pricing?.PromotionalPricing?._attributes,
                            pricing: parseFloat(item.Pricing?.PromotionalPricing?.Price[0]._attributes.price / item.Pricing?.PromotionalPricing?.Price[0]._attributes.divider)
                        }

                    })
                });
                //insert product data to the db and rename file if not get any error
                await productController.insertData(data, dirPath, filename);
                // console.log(data.length);
            }
        }
    } catch (error) {
        console.log(error);
        errorHandler(error);
    }

}

//Remove files and images which is already processed
module.exports.removeFiles = () => {

    try {
        const dirPath = path.join(__dirname, '../' + process.env.PATH_INVENTORY);
        const files = fs.readdirSync(dirPath);
        if (files.length > 0) {
            files.forEach(file => {
                if (file.includes("done")) {
                    fs.unlinkSync("".concat(dirPath, `/${file}`));
                }
            })
        }
        logFileHandler(); //log file emoving function
    } catch (error) {
        errorHandler(error);
    }

}


//Create Rest product if some items are left

module.exports.createRestRemainingItems = async () => {
    // const remainingItems = await fi
}

module.exports.createCustomerByCron = async () => {

    try {

        const configData = await cronConfig.findOne({ cronType: 'createCustomer' });
        let limit = 10;
        let offset;
        const resApp = [];

        if (configData) {
            limit = configData.limit;
            offset = configData.offset;
        } else {
            offset = 0;
            await cronConfig.create({ limit: limit, offset: offset, cronType: 'createCustomer' })
        }
        const customers = await Customer.find().limit(limit).skip(offset);

        if (customers.length > 0) {
            offset += limit;
            if (configData) {
                configData.offset = offset;
                configData.save();
            } else {
                await cronConfig.findOneAndUpdate({ cronType: 'createCustomer' }, { offset: offset });
            }

        } else {
            configData.offset = 0;
            configData.save();
        }
        console.log(customers.length);

        for (let i = 0; i < customers.length; i++) {
            const customer = customers[i];
            console.log(i);
            if (customer.ecrs_data.ema_emailAddress) {
                console.log(customer.ecrs_data.ema_emailAddress);
                let formattedText = '';
                let data = customer.ecrs_data;
                for (const key in data) {
                    if (Array.isArray(data[key])) {
                        const arrayValue = data[key].map(item => {
                            if (typeof item === "object") {
                                return Object.entries(item)
                                    .map(([innerKey, innerValue]) => `${innerKey}: ${innerValue}`)
                                    .join(", ");
                            }
                            return item;
                        });
                        formattedText += `${key}: ${arrayValue.join(", ")}\n`;
                    } else {
                        formattedText += `${key}: ${data[key]}\n`;
                    }
                }

                const input = {
                    email: customer.ecrs_data.ema_emailAddress,
                    firstName: customer.ecrs_data.FirstName,
                    lastName: (customer.ecrs_data.LastName) ? customer.ecrs_data.LastName : customer.ecrs_data.FirstName,
                    note: formattedText
                };


                //prepare metafields

                const metaData = [];



                if (customer.ecrs_data.hasOwnProperty('Loyalty')) {
                    metaData.push({
                        "key": "Loyalty",
                        "namespace": "custom",
                        "type": "single_line_text_field",
                        "value": `${customer.ecrs_data.Loyalty}`
                    });
                }
                if (customer.ecrs_data.hasOwnProperty('LoyaltyBalance')) {
                    console.log(customer.ecrs_data.LoyaltyBalance);
                    metaData.push({
                        "key": "LoyaltyBalance",
                        "namespace": "custom",
                        "type": "single_line_text_field",
                        "value": `${customer.ecrs_data.LoyaltyBalance}`
                    });
                }

                if (customer.ecrs_data.hasOwnProperty('Balance')) {
                    console.log(customer.ecrs_data.Balance);
                    metaData.push({
                        "key": "Balance",
                        "namespace": "custom",
                        "type": "single_line_text_field",
                        "value": `${customer.ecrs_data.Balance}`
                    });
                }

                if (customer.ecrs_data.hasOwnProperty('CreditLimit')) {
                    console.log(customer.ecrs_data.CreditLimit);
                    metaData.push({
                        "key": "CreditLimit",
                        "namespace": "custom",
                        "type": "single_line_text_field",
                        "value": `${customer.ecrs_data.CreditLimit}`
                    });
                }

                if (customer.ecrs_data.CustomerGroupName) {
                    input.tags = [customer.ecrs_data.CustomerGroupName];
                }


                if (metaData.length > 0) {
                    if (customer.shopify_customer_data) {
                        const shopifyMetafields = customer.shopify_customer_data.metafields.edges;

                        const combinedJSON = metaData.map((item) => {
                            const matchingNode = shopifyMetafields.find((edge) => edge.node.key === item.key);
                            if (matchingNode) {
                                return {
                                    ...item,
                                    id: matchingNode.node.id
                                };
                            } else {
                                return item;
                            }
                        });

                        input.metafields = combinedJSON;
                        console.log(combinedJSON);
                    } else {
                        console.log(metaData);
                        input.metafields = metaData;
                    }

                }

                if (customer.ecrs_data.CustomerAddress) {

                    const ecrs_addresses = customer.ecrs_data.CustomerAddress;
                    if (ecrs_addresses.length > 0) {
                        const addresses = ecrs_addresses.map((item, index) => {
                            const data = { country: item.Country.trim() };
                            data[`address1`] = item.StreetAddressLine1;
                            if (item.StreetAddressLine2) {
                                data[`address2`] = item.StreetAddressLine2;
                            }

                            return data;
                        })
                        input.addresses = addresses
                    }
                }

                if (customer.ecrs_data.PhoneNumbers) {
                    if (customer.ecrs_data.PhoneNumbers.length > 0) {
                        if (customer.ecrs_data.PhoneNumbers[0].PhoneNumber) {
                            if (customer.ecrs_data.PhoneNumbers[0].PhoneNumber.includes('+')) {
                                input.phone = customer.ecrs_data.PhoneNumbers[0].PhoneNumber;
                            }
                        }
                    }
                }

                const createCustomerMutation = `
                    mutation($input: CustomerInput!) {
                        customerCreate(input: $input) {
                        customer {
                            id
                            email
                            firstName
                            lastName
                            metafields(first: 250) {
                                edges {
                                    node {
                                       id
                                       key
                                    }
                                }
                            }
                        }
                        userErrors {
                            field
                            message
                        }
                        }
                    }
                    `;

                const updateCustomerMutation = `
                    mutation($input: CustomerInput!) {
                        customerUpdate(input: $input) {
                        customer {
                            id
                            email
                            firstName
                            lastName
                            metafields(first: 250) {
                                edges {
                                    node {
                                       id
                                       key
                                    }
                                }
                            }
                        }
                        userErrors {
                            field
                            message
                        }
                        }
                    }
                    `;

                let response;
                if (customer.shopify_customer_id) {
                    input.id = customer.shopify_customer_data.id;
                    response = await shopify.graphql(updateCustomerMutation, { input });
                    console.log("updated on shopify");
                } else {
                    response = await shopify.graphql(createCustomerMutation, { input });
                    console.log("created on shopify");
                }

                console.log(response);

                if (response.customerUpdate) {
                    if (response.customerUpdate.userErrors.length > 0) {
                        console.log(response.customerCreate.userErrors);
                    } else {
                        const shopifyCustomerData = response.customerUpdate.customer;
                        const shopify_customer_id = (response.customerUpdate.customer.id).split("/").pop();
                        await Customer.updateOne({ ecrs_id: customer.ecrs_id }, { $set: { shopify_customer_data: shopifyCustomerData, shopify_customer_id: shopify_customer_id } });
                        console.log(`${customer.ecrs_id} account created on shopify`);

                    }

                } else {
                    if (response.customerCreate.userErrors.length > 0) {
                        console.log(response.customerCreate.userErrors);
                    } else {
                        const shopifyCustomerData = response.customerCreate.customer;
                        const shopify_customer_id = (response.customerCreate.customer.id).split("/").pop();
                        await Customer.updateOne({ ecrs_id: customer.ecrs_id }, { $set: { shopify_customer_data: shopifyCustomerData, shopify_customer_id: shopify_customer_id } });
                        console.log(`${customer.ecrs_id} account created on shopify`);

                    }

                }

                resApp.push(customer.ecrs_id);

            } else {
                console.log(`no email id exist for this customer ${customer.ecrs_id}`);
                resApp.push(customer.ecrs_id);
            }

        }
        // console.log(resApp);

        return resApp;

    } catch (error) {


        console.log(error);

        return error;

    }

}