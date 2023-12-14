const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema({
    collectionId : String,
    title: String,
    createdAt: Date,
    updatedAt: Date,
    isUploadedShopify : {
        type : Boolean,
        default: false
    }
})


const collectionModel = mongoose.model("collection", collectionSchema);

module.exports = collectionModel;