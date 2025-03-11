const express = require("express");
const cors = require("cors");

//
//utilities functions and middleware files=========================================
const db = require("./utils/db-utils");
const crypto = require("./utils/crypto-utils");
const cryptoModule = require("crypto");

require("dotenv").config();

const authMiddleware = require("./middlewares/authMiddleware"); // Import JWT verification middleware

//
//setup server=========================================
const app = express();
app.use(express.json());
app.use(cors());

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

//
//endpoints=========================================
app.post("/create-user", async (req, res) => {
  // create the random seed value
  console.log("Creating user:", req.body);
  const user = req.body;
  user.seed = crypto.getSeed().toString();
  user.password = await crypto.hashData(user.password);
  user.latestTransactionTimestamp = 0;
  user.currentBalance = 200;
  await db.createUser(user);
  res.send({ seed: user.seed });
});

app.post("/login", async (req, res) => {
  const user = req.body;
  const dbUser = await db.getUser(user.username);
  console.log(dbUser);
  if (!dbUser) {
    res.status(404).send({ error: "User not found" });
    return;
  } else {
    if (await crypto.isHashCorrect(user.password, dbUser.password)) {
      const { username, firstName, lastName } = dbUser;
      const userDetails = { username, firstName, lastName };
      res.send({ jwt: crypto.generateJWT(userDetails), seed: dbUser.seed });
      return;
    } else {
      res.status(401).send({ error: "Incorrect password" });
      return;
    }
  }
});
crypto;
app.post("/initiate-transfer", authMiddleware, async (req, res) => {
  try {
    console.log("User", req.user);
    console.log("Body", req.body);

    const { encryptedTransactionData, transactionHash, receiverUsername } =
      req.body;

    // Fetch sender's seed from database
    const senderUser = await db.getUser(req.user.username);
    if (!senderUser) {
      return res.status(404).json({ error: "Sender not found" });
    }

    const seed = senderUser.seed; // Get the stored seed
    if (!seed) {
      return res.status(400).json({ error: "Encryption key (seed) missing" });
    }

    // Decrypt the encrypted transaction data using the seed
    const transactionData = await decryptData(encryptedTransactionData, seed);
    if (!transactionData) {
      return res.status(400).json({ error: "Invalid transaction data" });
    }

    // Verify transaction integrity
    const transactionValid = await crypto.verifyTransaction(
      transactionData,
      transactionHash
    );
    if (!transactionValid) {
      return res.status(400).json({ error: "Transaction verification failed" });
    }

    // Perform fund transfer
    const transferResult = await db.transferFunds(
      transactionData.username,
      receiverUsername,
      transactionData.amount
    );

    if (transferResult.error) {
      return res.status(400).json({ error: "Transfer failed" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error processing transaction:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// AES decryption function
async function decryptData(encryptedData, seed) {
  try {
    const key = await crypto.hashData(seed); // Derive a 256-bit key from seed
    const decipher = cryptoModule.createDecipheriv("aes-256-ecb", key, null); // AES-ECB mode does not require an IV
    let decrypted = decipher.update(encryptedData, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
}

app.get("/get-balance", authMiddleware, async (req, res) => {
  const user = await db.getUser(req.user.username);
  const balance = user.currentBalance;
  console.log(balance);
  res.send({ balance: balance });
});

app.get("/get-transactions", authMiddleware, async (req, res) => {
  const transactions = await db.getTransactions(req.user.username);

  console.log(transactions);
  res.send({ transactions: transactions });
});
