const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generateToken = require("../utils/generateToken");
const { validationResult } = require('express-validator');

// Authorization
// JWT - json web token

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();

    res.send(users);
  } catch (error) {
    res.sendStatus(500);
  }
};

const getSingleUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);

    res.send(user);
  } catch (error) {
    res.sendStatus(500);
  }
};

const singup = async (req, res) => { console.log(req.body);
  const { name, email, password, confirmPassword } = req.body;
  //check error from use request using express validation
  // const errors = validationResult(req);
  // if(!errors.isEmpty()){
  //   return res.status(400).json({errors: errors.array()})
  // }

  try {
    const oldUser = await User.findOne({ email });
    if (oldUser) {
      res.status(400).send("There is already a user with this email...");
      return;
    }

    if (password.length < 7) {
      res.status(400).send("Password mush be at least 7 characters...");
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).send("Password and confirm must be the same...");
      return;
    }

    const user = new User({
      name,
      email,
      password,
    });

    user.password = await bcrypt.hash(user.password, 10);

    await user.save();

    const token = await generateToken(user);

    res.send({ user, token });
  } catch (error) {
    res.sendStatus(500);
    console.log(error);
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      res.status(400).send("Wrong Creditionals");
      return;
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      res.status(400).send("Wrong Creditionals");
      return;
    }

    const token = await generateToken(user);

    res.send({ user: user.name, token });
  } catch (error) {
    res.sendStatus(500);
  }
};

const logout = async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((data) => {
      return data.token !== req.token;
    });

    await req.user.save();
    res.send("Done log out");
  } catch (error) {}
};

module.exports = { singup, login, getAllUsers, getSingleUser, logout };
