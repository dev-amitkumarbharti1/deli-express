const https = require('https');

// Http Get Request

// Options Formate
// const options = {
//     hostname: API HOSTNAME,
//     path: API PATH,
//     method: 'GET',
//     headers: {
//         'Content-Type': 'application/json',
//     }
// };

module.exports.get = (options) => {

    return new Promise((resolve, reject) => {

        const request = https.request(options, (response) => {
            let body = '';
            response.on('data', (chunk) => {
                body += chunk;
            });
            response.on('end', () => {
                resolve(JSON.parse(body));
            });
        });

        request.on('error', (error) => {
            reject(error);
        });
        request.end();


    });
};


// Http Post Request

// Test Data Formate

// const data = JSON.stringify(
//     {
//         "SearchByKeywordRequest": {
//             "keyword": "Bel",
//             "records": 0,
//             "startingRecord": 0
//         }
//     }
// );

// const options = {
//     hostname: process.env.API_HOST_NAME,
//     path: `/api/v1/search/keyword?apiKey=${process.env.API_KEY}`,
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json',
//         'Content-Length': data.length
//     }
// };

module.exports.request = (options, data) => {

    return new Promise((resolve, reject) => {

        const request = https.request(options, (response) => {
            let body = '';
            response.on('data', (chunk) => {
                body += chunk;
            });
            response.on('end', () => {
                resolve(JSON.parse(body));
            });
        });

        request.on('error', (error) => {
            reject(error);
        });

        request.write(data);
        request.end();

    });
}