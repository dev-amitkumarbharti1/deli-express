const mongoose = require("mongoose");

const cronConfigSchema = new mongoose.Schema({
    limit: Number,
    offset: Number,
    cronType: String
})


const cronConfig = mongoose.model("cronConfig", cronConfigSchema);

module.exports = cronConfig;