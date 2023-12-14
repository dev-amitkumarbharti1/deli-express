const fs = require("fs");
const convertJson = require("xml-js");
const path = require("path");

class InventoryFile {
    constructor(path) {
        this.path = path;
    }

    getFile() {
        const files = fs.readdirSync(this.path);
        let data = {};
        if (files.length > 0) {
            files.forEach(file => {
                // console.log(file);
                if (!file.includes("done") && file.includes('xml')) {
                    // console.log(file);
                    const fileData = fs.readFileSync(path.join(this.path, file));
                    const JsonData = convertJson.xml2json(fileData, { compact: true, spaces: 4 });
                    data = {
                        filename: file,
                        JsonData: JSON.parse(JsonData)
                    }
                }
            })
            return data;
        }

    }

}

module.exports = InventoryFile;