const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const cors = require("cors");
// Routes
const authRoutes = require("./routes/auth.routes");
const chatRoutes = require("./routes/chat.routes");

const app = express();

// Usign Middelwares
app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());
app.use(cors());


//Using Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.get("*name", (req,res)=>{
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
})

module.exports = app;
