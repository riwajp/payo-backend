const crypto = require("crypto"); // library for cryptography utilities
const bcrypt = require("bcrypt"); // library for hashing
const jwt = require("jsonwebtoken"); // library for handling json web tokens
const db = require("./db-utils");

const SALT_ROUNDS = 10; //number of salting rounds for hashing, higher the number, more secure the hash

const getSeed = () => {
  return crypto.getRandomValues(new Uint32Array(1))["0"];
};

const getChunks = (text, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
};

const hashData = async (plainText) => {
  return await bcrypt.hash(plainText, SALT_ROUNDS);
};

const hashLargeData = async (plainText) => {
  const chunks = getChunks(plainText, 72); // Split the string into 72-character chunks

  // Step 2: Hash each chunk individually
  const hashedChunks = [];
  for (let i = 0; i < chunks.length; i++) {
    const hash = await hashData(chunks[i]); // Use bcrypt to hash each chunk
    hashedChunks.push(hash);
  }

  // Return the array of hashes corresponding to the substrings
  return hashedChunks;
};

const isHashCorrect = async (plainText, hashedText) => {
  return await bcrypt.compare(plainText, hashedText);
};

const isLargeHashCorrect = async (plainText, hashedChunks) => {
  // Step 1: Split plainText into substrings of 72 characters
  const chunks = getChunks(plainText, 72);

  // Step 2: Compare each chunk with the corresponding hash
  for (let i = 0; i < chunks.length; i++) {
    const isMatch = await bcrypt.compare(chunks[i], hashedChunks[i]);
    console.log(i);
    if (!isMatch) {
      return false; // Return error if any chunk doesn't match
    }
  }

  // All chunks match
  return true;
};

const generateJWT = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET);
};

const verifyTransaction = async (transactionData, transactionHash) => {
  const currentTime = new Date().getTime();

  const user = await db.getUser(transactionData.username);

  //error checks
  if (!user) return { error: "User not found" };

  if (
    !(await isLargeHashCorrect(
      JSON.stringify({ ...transactionData, seed: user.seed }),
      transactionHash
    ))
  ) {
    return { error: "Incorrect hash" };
  }

  if (transactionData.timestamp > currentTime)
    return { error: "Future timestamp" };

  if (user.latestTransactionTimestamp >= transactionData.timestamp)
    return { error: "Expired transaction (transaction overridden)" };

  if (currentTime - transactionData.timestamp > 10000)
    return { error: "Expired transaction (timestamp expiration)" };

  if (user.currentBalance < transactionData.amount)
    return { error: "Insufficient balance" };

  return { error: false };
};
module.exports = {
  getSeed,
  hashData,
  hashLargeData,
  isHashCorrect,
  isLargeHashCorrect,
  generateJWT,
  verifyTransaction,
};
