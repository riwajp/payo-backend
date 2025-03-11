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
  console.log("Creating user:", req.body);
  const user = req.body;
  user.seed = crypto.getSeed();
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
      res.send({ jwt: crypto.generateJWT(userDetails) });
      return;
    } else {
      res.status(401).send({ error: "Incorrect password" });
      return;
    }
  }
});

app.post("/initiate-transfer", authMiddleware, async (req, res) => {
  console.log("User", req.user);
  console.log("Body", req.body);
  const { transactionData, transactionHash, receiverUsername } = req.body;
  const transactionStatus = await crypto.verifyTransaction(
    transactionData,
    transactionHash
  );

  if (transactionStatus.error) {
    console.log(transactionStatus.error);
    res.status(400).send({ error: "Transaction failed" });
    return;
  }

  await db.transferFunds(
    transactionData.username,
    receiverUsername,
    transactionData.amount
  );
  res.send({ error: false });
});

app.get("/get-balance", authMiddleware, async (req, res) => {
  const user = await db.getUser(req.user.username);
  const balance = user.currentBalance;
  console.log(balance);
  res.send({ balance: balance });
});
