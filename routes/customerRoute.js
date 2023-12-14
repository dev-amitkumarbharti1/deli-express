const express = require('express');
const router = express.Router();
const customerController = require("../controllers/customerController");

router.get("/api/customer", customerController.getCustomerList);
router.post("/api/customer", customerController.createCustomer);

module.exports = router;