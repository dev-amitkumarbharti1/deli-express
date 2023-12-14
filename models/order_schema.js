const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    orderNumber: Number,
    orderId: Number,
    fulfillmentDate: Date,
    creationDate: Date,
    line_items: [Object],
    shipping_lines: [Object],
    total_shipping_price_set: Object,
    payAtStore: {
        type: Boolean,
        default: false
    },
    delivered: {
        type: Boolean,
        default: false
    },
    total: Number,
    fulfillment_status: Boolean,
    customer: {
        name: String,
        accountNumber: Number,
        email: String
    },
    items: Array,
    isFileSend: {
        isSend: Boolean,
        sendDate: Date,
        fileName: String
    }
})

const orderModel = mongoose.model("Order", orderSchema);

module.exports = orderModel;