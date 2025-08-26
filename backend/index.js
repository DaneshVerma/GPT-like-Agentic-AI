const dotenv = require("dotenv").config();
const app = require("./src/app");
const connectToDB = require("./src/db/db")

connectToDB();
app.listen(3000, (req, res) => {
  console.log("server listining on port 3000");
});
