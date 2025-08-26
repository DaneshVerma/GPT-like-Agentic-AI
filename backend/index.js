const dotenv = require("dotenv").config();
const app = require("./src/app");
const connectToDB = require("./src/db/db");
const { initSocketServer } = require("./src/sockets/socket.server");
const { createServer } = require("http");

httpServer = createServer(app); //created a http server via passing app on create server
initSocketServer(httpServer); //passed the server instance to initailze socket.io server
connectToDB(); //connection to data base

httpServer.listen(3000); //application http server starts listning here
