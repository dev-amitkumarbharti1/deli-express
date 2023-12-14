
const fs = require("fs");
const orderModel = require("../models/order_schema");
const productModel = require("../models/product_schema");
const errorHandler = require("../utils/errorHandler");
const productLogGenerator = require("../utils/logGenerator");
const Customer = require("../models/customer");

const createFileandUpdateDB = (orderData, customer_id) => {
    console.log("here..");
    try {
        const { orderNumber, orderId, fulfillmentDate, creationDate, total, payAtStore, delivered, customer, items, total_shipping_price_set } = orderData;//email="${customer.email}"
        const dirPath = process.env.PATH_ORDER;
        const timeStamp = new Date().getTime();
        const fileName = `${orderNumber}-${timeStamp}.xml`;

        let fileData = `<Order orderNumber="${orderNumber}" fulfillmentDate="${fulfillmentDate.toISOString().split('.')[0]}" creationDate="${creationDate.toISOString().split('.')[0]}" payAtStore="true" delivered="${delivered}" total="${total}">
        <Customer name="${customer.name}" accountNumber="sh${customer_id || customer.accountNumber}"  />
        <Service scancode="eService" quantity="1"/>
        <Delivery scancode="eDelivery" quantity="0"/>
        `;
        items.forEach(item => {
            const { scancode, priceLevel, productType, quantity, price } = item;
            const scanCodeHtml = (scancode.length > 1) ? scancode.map((code, i) => {
                if (i !== 0) return `<LinkedItem scancode="${code}"/>`
            }) : '';
            const isWeightedProduct = (productType === 'WeightProduct') ? true : false;
            fileData += `<Item scancode="${scancode[0]}" priceLevel="${priceLevel}">
            ${(isWeightedProduct) ? `<Weight amount="${quantity / 1000}" unit="lb"/>` : `<Quantity>${quantity}</Quantity>`}
            ${(scanCodeHtml !== '') ? scanCodeHtml.join('\n') : ''}
            </Item>
            `;
        });
        fileData += `<Item scancode="SHIPPING" priceLevel="1"><Quantity>1</Quantity></Item></Order>`;

        fs.writeFile(`${dirPath}/${fileName}`, fileData, async (err) => {
            if (!err) {
                console.log(err);
                productLogGenerator("../log/order/shopify", `${orderId}.log`, `Order XML file created\n ${JSON.stringify(fileData)}\n\n`);
                await orderModel.findOneAndUpdate({ orderId: orderId }, {
                    isFileSend: {
                        isSend: true,
                        sendDate: Date.now(),
                        fileName: fileName
                    }
                })
            }
            else {
                console.log(err);
                //  errorHandler(err);
            }
        });

    } catch (error) {
        console.log(error);
        // errorHandler(error);
    }

}


const getOrderDetails = async (req, res, next) => {
    try {
        const { id, order_number, fulfillment_status, fulfillments, closed_at, current_total_price, customer, line_items, shipping_lines, total_shipping_price_set } = req.body;//created_at
        let closedAt = '';
        const created_at = Date.now();

        // (closed_at !== null) ? closedAt = new Date(closed_at) : new Date();
        let nowDate = new Date();
        //console.log(closed_at, nowDate < closedAt);//&& closed_at !== null && nowDate < closedAt
        nowDate.setMinutes(nowDate.getMinutes() - 2);
        if (fulfillment_status !== null) {
            let itemArr = [];
            const newOrderData = {
                orderNumber: order_number,
                orderId: id,
                fulfillmentDate: (fulfillments[0].created_at) ? fulfillments[0].created_at : Date.now(),
                creationDate: (created_at == null) ? created_at : Date.now(),
                total: current_total_price,
                fulfillment_status: true,
                customer: {
                    name: `${customer.first_name} ${customer.last_name}`,
                    accountNumber: customer.id,
                    email: customer.email
                },
            }

            for (let index = 0; index < line_items.length; index++) {
                const element = line_items[index];
                const orderProduct = await productModel.findOne({ "shopifyProduct.productId": element.product_id });
                itemArr.push({
                    quantity: element.quantity,
                    productId: element.product_id,
                    priceLevel: element.variant_title.split('/')[1].replace(/[^\d]/g, ''),
                    productType: (orderProduct.isWeightProduct) ? 'WeightProduct' : 'QuantityProduct',
                    scancode: orderProduct.scanCodes,
                    price: element.price

                })
            }
            newOrderData.items = itemArr;
            newOrderData.line_items = line_items;
            newOrderData.shipping_lines = shipping_lines;
            newOrderData.total_shipping_price_set = total_shipping_price_set;
            let orderDataToDB;
            const dbOrder = await orderModel.findOne({ orderId: id });
            if (dbOrder) {
                orderDataToDB = dbOrder;
                dbOrder.line_items = line_items;
                dbOrder.items = itemArr;
                dbOrder.shipping_lines = shipping_lines;
                dbOrder.total_shipping_price_set = total_shipping_price_set;
                dbOrder.save();
            } else {
                orderDataToDB = await orderModel.create(newOrderData);
            }

            console.log(customer.email);
            const customer_data = await Customer.findOne({ 'shopify_customer_data.email': customer.email });//{ customer_id }
            console.log(customer_data);
            createFileandUpdateDB(orderDataToDB, customer_data.customer_id);
            productLogGenerator("../log/order/DB", `${orderDataToDB._id}.log`, `Order Created to DB\n ${JSON.stringify(orderDataToDB)}\n\n`);
            res.status(200).json("Success");
        } else {
            res.status(200).json("Success");
        }
    } catch (error) {
        console.log(error);
        errorHandler(error);
    }
}


module.exports = getOrderDetails;