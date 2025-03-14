const crypto = require("crypto"); // library for cryptography utilities
const jwt = require("jsonwebtoken"); // library for handling json web tokens
const db = require("./db-utils");
const { sha256 } = require("js-sha256");
const SALT_ROUNDS = 10; //number of salting rounds for hashing, higher the number, more secure the hash

const getSeed = () => {
  return crypto.getRandomValues(new Uint32Array(1))["0"];
};

const hashData = async (plainText) => {
  return sha256.create().update(plainText).hex().toString();
};

const isHashCorrect = async (plainText, hashedText) => {

  return (await hashData(plainText)) == hashedText;
};

const generateJWT = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET);
};

const verifyTransaction = async (transactionData, transactionHash) => {
  const currentTime = new Date().getTime();

  const user = await db.getUser(transactionData.username);

  //error checks
  if (!user) return { error: "User not found" };
  console.log("helklo1111");
  if (
    !(await isHashCorrect(
      JSON.stringify({ ...transactionData, seed: user.seed }),
      transactionHash
    ))
  ) {
    return { error: "Incorrect hash" };
  }
  console.log("helklo112222222222211");
  if (transactionData.timestamp > currentTime)
    return { error: "Future timestamp" };
console.log("helklo11133333333333333331");

  if (user.latestTransactionTimestamp >= transactionData.timestamp)
    return { error: "Expired transaction (transaction overridden)" };

  console.log("asssssssssssss",currentTime - transactionData.timestamp )

  if (currentTime - transactionData.timestamp > 15000)
    return { error: "Expired transaction (timestamp expiration)" };

  if (user.currentBalance < transactionData.amount)
    return { error: "Insufficient balance" };

  return { error: false };
};
module.exports = {
  getSeed,
  hashData,
  isHashCorrect,

  generateJWT,
  verifyTransaction,
};
