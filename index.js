require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const connectDB = require("./src/config/db");
const notfound = require("./src/middlewares/notfound");
const errorhandler = require("./src/middlewares/error");
const routerauth = require("./src/routers/auth");

const app = express();
app.use(express.json());

app.use("/api/auth", routerauth);
app.use("/", (req, res) => {
  res.status(200).json({ message: "success" });
});

app.use(notfound);
app.use(errorhandler);
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
