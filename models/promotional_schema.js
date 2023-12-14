
const mongoose = require("mongoose");

const promotionalDate = new mongoose.Schema({
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product'
    },
    productId: Number,
    promotionalPrice: {
        attribute: Array,
        pricing: String
    }
});

const promotionalModel = mongoose.model("Promotional", promotionalDate);

module.exports = promotionalModel;