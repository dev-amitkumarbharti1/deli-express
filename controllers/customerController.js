const shopify = require("../utils/shopifyNode");
const Customer = require("../models/customer");
const path = require("path");
const fs = require("fs");

module.exports.getCustomerList = async (req, res, next) => {

    try {

        //console.log(await shopify.customer.count());
        const customerCount = await shopify.customer.count();
        const pages = Math.ceil(customerCount / 50);
        console.log(pages);
        let params = { limit: 50 };


        do {
            const customers = await shopify.customer.list(params);

            console.log(customers.length);

            for (let i = 0; i < customers.length; i++) {

                const { email, first_name, last_name, id: shopify_customer_id } = customers[i];
                const customer = await Customer.findOne({ shopify_customer_id: shopify_customer_id });
                if (email == 'stefan@d2cm.co') {
                    console.log()
                }
                if (!customer) {
                    await Customer.create({
                        shopify_customer_id: shopify_customer_id,
                        shopify_customer_data: { email, first_name, last_name },
                        email: email
                    })

                }

            }

            params = customers.nextPageParameters;
        } while (params !== undefined);

        res.send({ success: "customer imported successfully" });

    } catch (err) {

        console.log(err);

    }



}

module.exports.createCustomer = async (req, res, next) => {

    try {

        const { first_name, last_name, email, id: shopify_customer_id } = req.body;

        const customer = await Customer.findOne({ email: email });
        if (!customer) {
            await Customer.create({
                shopify_customer_id: shopify_customer_id,
                shopify_customer_data: { email, first_name, last_name },
                email: email
            })
        }

        res.status(200).json("success");

    } catch (err) {

        console.log(err);

    }

}


//Read customer json file and insert into db
module.exports.readFileCreateCustomer = async () => {
    const dirPath = path.join(__dirname, '../' + process.env.PATH_CUSTOMER);
    const Files = fs.readdirSync(dirPath);
    for (let f = 0; f < Files.length; f++) {

        const file = Files[f];
        if (!file.includes("done")) {
            const fileData = fs.readFileSync(path.join(dirPath, file), 'utf8');
            const customerData = JSON.parse(fileData.trim());

            for (let i = 0; i < customerData.length; i++) {
                const customer = customerData[i];

                let isCustomer = await Customer.findOne({ ecrs_id: { $exists: true, $eq: customer.AccountID } });

                if (isCustomer) {
                    console.log(isCustomer);
                    isCustomer.ecrs_data = customer;
                    isCustomer.save();
                } else {
                    await Customer.create({
                        ecrs_id: customer.AccountID,
                        ecrs_data: customer
                    })
                }
            }

            fs.renameSync("".concat(dirPath, `/${file}`), "".concat(dirPath, `/${file}.done`));
        }

    }

}