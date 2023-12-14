
const fs = require("fs");
const path = require("path");

const errorHandler = (errorData) => {
    try {
        const fileName = `exception-${new Date().getTime()}.log`;
        fs.writeFileSync(path.join(__dirname, `../log/exception/${fileName}`), errorData.toString());
    } catch (error) {
        console.log(error);
    }
}

module.exports = errorHandler;