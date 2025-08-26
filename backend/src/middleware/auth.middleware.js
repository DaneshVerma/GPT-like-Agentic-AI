const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

async function authUserMiddleware(req, res, next) {
  const { token } = req.cookies;
  if (!token) {
    return res
      .json({
        message: "unouthorized",
      })
      .status(401);
  }
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(id);
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      message: "unautorized",
    });
  }
}

module.exports = authUserMiddleware;
