const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    shopifyProduct: {
        productId: Number,
        createdAt: Date,
        updatedAt: Date
    },
    scanCodes: Array,
    discontinue: Boolean,
    taxExempt: Boolean,
    name: {
        type: String,
        required: [true, 'Product name always required']
    },
    size: String,
    brand: String,
    department: String,
    weightUnit: String,
    onHand: Number,
    safetyStock: Number,
    location: String,
    powerFields: Array,
    image: String,
    pricing: Array,
    isWeightProduct: Boolean,
    isAlternateItem: Boolean,
    isPromotionalPrice: Boolean,
    promotionalPrice: {
        attribute: Array,
        pricing: String
    },
    isUploadShopify: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    });

productSchema.index({ scanCodes: 1 });

productSchema.pre('findOneAndUpdate', function () {
    this._update.updatedAt = Date.now();
});

productSchema.pre("save", function (next) {
    if (this.weightUnit) {
        this.isWeightProduct = true;
    }
    else {
        this.isWeightProduct = false;
    }
    next();
})

productSchema.virtual('promotionalsData', {
    ref: 'Promotional',
    foreignField: 'product',
    localField: '_id'
})

const productModel = mongoose.model("Product", productSchema);

module.exports = productModel;