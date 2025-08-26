const mongoose = require("mongoose");
function connectToDB() {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("connected to db"))
    .catch((err) => console.log("error connecting to db \n", err.message));
}
module.exports = connectToDB;
