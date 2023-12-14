const { get } = require("./Http");


class GetImage {

    constructor(scanCodes) {
        this.scanCodes = scanCodes;
    }

    async getProductImage() {

        let codes = this.scanCodes.map(item => item.scanCodes);
        let filterCodes = codes.filter(item => item.length >= 12);

        // let imageResponse = await this.image(filterCodes);

        for (let i = 0; i < filterCodes.length; i++) {
            let code = filterCodes[i];
            const options = {
                hostname: process.env.X_IMAGE_HOST_NAME,
                path: `/code/${code}`,
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': process.env.X_IMAGE_API_KEY,
                    'X-RapidAPI-Host': process.env.X_IMAGE_HOST_NAME
                }
            };

            const responseData = await get(options);

            if (responseData.codeType != null) {
                if (responseData.product) {
                    if (responseData.product.imageUrl != undefined) {
                        return responseData.product;
                    } else if ((responseData.product.imageUrl == undefined) && (i == (filterCodes.length - 1))) {
                        return false;
                    }

                } else {
                    return false;
                }

            } else {
                continue;
            }
        }

    }

}


module.exports = GetImage;