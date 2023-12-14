const Shopify = require("shopify-api-node");

const shopify = new Shopify({
    shopName: process.env.SHOPIFY_STORE_URL,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
    autoLimit: { calls: 2, interval: 1000, bucketSize: 35 }
});

module.exports = shopify;