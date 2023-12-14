const axios = require("axios");

const axiosMethod = (method, data, endUrl) => {
    const baseUrl = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/${process.env.SHOPIFY_API_VERSION}`;

    const config = {
        method: method,
        url: "".concat(baseUrl, endUrl),
        headers: {
            'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
            'Content-Type': 'application/json'
        }
    };

    (data !== null && method !== 'GET') ? config.data = JSON.stringify(data) : '';
    
    return axios(config);
}

module.exports = axiosMethod;