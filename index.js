require('dotenv').config();
const express = require("express")
const morgan = require("morgan")
const cors = require("cors")
const connectDB = require("./src/config/db")
const notfound = require('./src/middlewares/notfound')
const errorhandler = require('./src/middlewares/error')
const routerauth = require("./src/routers/auth")

const app = express()
app.use(express.json());


app.use(notfound)
app.use(errorhandler)
app.use("api/auth" , routerauth)



const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

