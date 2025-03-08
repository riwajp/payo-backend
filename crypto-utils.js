const crypto = require("crypto"); // library for cryptography utilities
const bcrypt = require("bcrypt"); // library for hashing

const SALT_ROUNDS = 10; //number of salting rounds for hashing, higher the number, more secure the hash

const getSeed = () => {
  return crypto.getRandomValues(new Uint32Array(1))["0"];
};

const hashPassword = async (plainPassword) => {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
};

module.exports = {
  getSeed,
  hashPassword,
};
