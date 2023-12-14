const express = require("express");
const router = express.Router();
const getOrderDetails = require("../controllers/orderController");
const GetImage = require("../utils/getImage");
const productLogGenerator = require("../utils/logGenerator");

router.route("/api/order").post(getOrderDetails);

router.post("/api/ecrs-data", (req, res, next) => {
    try {

        //  console.log(req.body);
        productLogGenerator("../log/ecrs", `data.log`, `ECRS REsponse\n ${JSON.stringify(req.body)}\n\n${JSON.stringify(req.headers)}`);

        res.send("data recieved");

    } catch (error) {
        productLogGenerator("../log/ecrs", `error.log`, `ECRS Error \n ${JSON.stringify(error)}\n\n`);
    }
})

// router.get("/api/image", async (req, res, next) => {
//     let scanCodes = [
//         { scanCodes: '049000026276' },
//         { scanCodes: '0126807' },
//         { scanCodes: '320287' }
//     ];


//     const imageResponse = await new GetImage(scanCodes).getProductImage();

//     console.log(imageResponse);

// })

module.exports = router;