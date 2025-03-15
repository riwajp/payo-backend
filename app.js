const express = require("express");
const cors = require("cors");

//
//utilities functions and middleware files=========================================
const db = require("./utils/db-utils");
const crypto = require("./utils/crypto-utils");

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
    const { senderUsername, encryptedData, transactionHash, receiverUsername } =
      req.body;

    // Fetch sender's seed from database
    const receiverUser = await db.getUser(req.user.username);
    const senderUser = await db.getUser(senderUsername);
    if (!receiverUser) {
      return res.status(404).json({ error: "Receiver not found" });
    }

    const seed = senderUser.seed; // Get the stored seed
    if (!seed) {
      return res.status(400).json({ error: "Encryption key (seed) missing" });
    }

    // Decrypt the encrypted transaction data using the seed
    const transactionData = await decryptData(encryptedData, seed);
    console.log(transactionData);
    if (!transactionData) {
      return res.status(400).json({ error: "Invalid transaction data" });
    }

    // Verify transaction integrity
    const transactionValid = await crypto.verifyTransaction(
      transactionData,
      transactionHash
    );
    console.log(transactionValid.error);
    if (transactionValid.error) {
      return res.status(400).json({ error: "Transaction verification failed" });
    }

    // Perform fund transfer
    console.log(
      "hereeeeeeeee",
      transactionData.username,
      receiverUsername,
      transactionData.amount
    );

    const transferResult = await db.transferFunds(
      senderUsername,
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
    const CryptoJS = (await import("crypto-es")).default;

    const key = await crypto.hashData(seed); // Derive a 256-bit key from seed

    // const decipher = cryptoModule.createDecipheriv("aes-256-ecb", key, null); // AES-ECB mode does not require an IV
    // decipher.setAutoPadding(true); // Enable auto padding

    const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });

    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
    // let decrypted = decipher.update(encryptedData, "base64", "utf8");
    // decrypted += decipher.final("utf8");
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
}

app.get("/get-balance", authMiddleware, async (req, res) => {
  const user = await db.getUser(req.user.username);
  const balance = user.currentBalance;

  res.send({ balance: balance });
});

app.get("/get-transactions", authMiddleware, async (req, res) => {
  const transactions = await db.getTransactions(req.user.username);

  res.send({ transactions: transactions });
});
