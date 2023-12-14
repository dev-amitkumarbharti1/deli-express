const fs = require('fs');
const path = require('path');

const productLogGenerator = (folder, fileName, data) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const folderName = `${year}-${month}-${day}`;
    const folderPath = path.join(__dirname, `${folder}/${folderName}`);

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }
    
    const filePath = path.join(folderPath, fileName);
    fs.appendFile(filePath, data, (err) => {
        console.log(`File ${fileName} created successfully in folder ${folderName}.`);
    });
}

module.exports = productLogGenerator;
