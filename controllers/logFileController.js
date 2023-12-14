const fs = require('fs');
const path = require('path');

const mainFolders = ['log/collection', 'log/order', 'log/product'];
const subFolders = ['DB', 'shopify'];

const calculateDifferenceDays = (date) => {
    const specifiedDate = new Date(date);
    const currentDate = new Date();
    const differenceInTime = currentDate.getTime() - specifiedDate.getTime();
    const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
    return differenceInDays;
}

const logFileHandler = () => {
    mainFolders.forEach((mainFolder) => {
        subFolders.forEach((subFolder) => {
            const folderPath = path.join(mainFolder, subFolder);
            if (fs.existsSync(folderPath)) {
                const dateFolder = fs.readdirSync(folderPath);
                dateFolder.forEach(date => {
                    const dateFolderPath = path.join(folderPath, date);
                    if (fs.existsSync(dateFolderPath)) {
                        const days = calculateDifferenceDays(date);
                        if(days > 15){ //remove 15 days old log file
                            fs.rmSync(dateFolderPath, { recursive: true });
                            console.log("Folder Removed-", date);
                        }
                    }
                })
            }
        });
    });
};



module.exports = logFileHandler;
