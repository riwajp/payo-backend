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
    } else {
      res.status(401).send({ error: "Incorrect password" });
    }
  }
});

app.post("/initiate-transfer", authMiddleware, async (req, res) => {
  console.log(req.user);
  console.log(req.body);
  const { transactionData, transactionHash, recieverUsername } = req.body;
  const transactionStatus = await crypto.verifyTransaction(
    transactionData,
    transactionHash
  );

  if (transactionStatus.error) {
    console.log(transactionStatus.error);
    res.status(400).send({ error: "Transaction failed" });
  }

  await db.transferFunds(
    transactionData.username,
    recieverUsername,
    transactionData.amount
  );
  res.send("Transfer initiated");
});
