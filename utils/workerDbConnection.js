const mongoose = require("mongoose");

module.exports.connect = () => {
    mongoose.set("strictQuery", false);
    const MONGO_URI = process.env.DATABASE;
    mongoose.connect(MONGO_URI).then(res => {
        console.log(`Connected to MongoDB in worker thread`);
    }).catch(err => {
        console.log(err);
    })
}

module.exports.close = () => {
    mongoose.connection.close((err) => {
        if (err) {
            console.error('Error closing Mongoose connection:', err);
        } else {
            console.log('Mongoose connection closed successfully');
        }
    });
}
