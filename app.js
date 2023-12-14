require("dotenv").config({ path: './config.env' });
const express = require("express");
const app = express();
const db = require("./db/db");
const router = require("./routes/orderRoute");
const customerRoute = require("./routes/customerRoute");
const productRoutes = require("./routes/productRoute");



app.use(express.json());

app.get("/", (req, res) => {
  res.send("imart app running");
})

app.use(router);
app.use(productRoutes);
app.use(customerRoute);

app.use((req, res, next) => {
  //res.send("Running...");
  next();
})



db(process.env.DATABASE).then(() => {
  console.log("DB Connected");
  require("./cronJobExecute");

}).catch(err => {
  console.log("DB error", err);
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);

  process.exit(1);
});

app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server Running on ${process.env.SERVER_PORT}`);
})