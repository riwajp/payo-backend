const crypto = require("crypto"); // library for cryptography utilities
const bcrypt = require("bcrypt"); // library for hashing
var jwt = require("jsonwebtoken"); // library for handling json web tokens

const SALT_ROUNDS = 10; //number of salting rounds for hashing, higher the number, more secure the hash

const getSeed = () => {
  return crypto.getRandomValues(new Uint32Array(1))["0"];
};

const hashPassword = async (plainPassword) => {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
};

const isPasswordCorrect = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

const generateJWT = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET);
};

module.exports = {
  getSeed,
  hashPassword,
  isPasswordCorrect,
  generateJWT,
};
