const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
async function register(req, res) {
  const {
    fullName: { firstName, lastName },
    email,
    password,
  } = req.body;

  const isUserAlreadyExist = await userModel.findOne({ email: email });
  if (isUserAlreadyExist) {
    res.json({ message: "user already exist" }).status(400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userModel.create({
    fullName: {
      firstName,
      lastName,
    },
    email,
    password: hashedPassword,
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.cookie("token", token);
  res
    .json({
      message: "user created succesfully",
      user: {
        email: user.email,
        id: user._id,
        fullName: user.fullName,
      },
    })
    .status(2000);
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await userModel.findOne({
    email,
  });
  if (!user) {
    return res.status(400).json({ message: "invalid email or password" });
  }
  const isPasswordValid = bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "invalid email or password" });
  }
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.cookie("token", token);
  res.json({
    message: "logged in succesfully",
    user: {
      fullName: user.fullName,
      email: user.email,
      id: user._id,
    },
  });
}

async function validateToken(req, res) {
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ message: "unauthorized" });
  }
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json({ message: "authorized" });
  } catch (err) {
    return res
      .status(401)
      .json({ message: "unauthorized", error: err.message });
  }
}

module.exports = {
  register,
  login,
  validateToken,
};
