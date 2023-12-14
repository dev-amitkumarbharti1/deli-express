const mongoose = require('mongoose');
const { autoInc } = require("auto-increment-group");

const Schema = mongoose.Schema;

const customerSchema = Schema({
    customer_id: String,
    shopify_customer_id: Number,
    ecrs_id: String,
    email: String,
    shopify_customer_data: Object,
    ecrs_data: Object
});

customerSchema.plugin(autoInc, {
    field: "customer_id",
    digits: 4,
    startAt: 1,
    incrementBy: 1,
    unique: true
});

const Customer = mongoose.model('customer', customerSchema);
module.exports = Customer;