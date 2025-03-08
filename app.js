const express = require("express");

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

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

//
//endpoints=========================================
app.post("/create-user", async (req, res) => {
  // create the random seed value
  const user = req.body;
  user.seed = crypto.getSeed();
  user.password = await crypto.hashPassword(user.password);
  await db.createUser(user);
  res.send({ seed: user.seed });
});

app.post("/login", async (req, res) => {
  const user = req.body;
  const dbUser = await db.getUser(user.username);
  if (!dbUser) {
    res.status(404).send("User not found");
    return;
  } else {
    if (await crypto.isPasswordCorrect(user.password, dbUser.password)) {
      const { username, firstName, lastName } = dbUser;
      const userDetails = { username, firstName, lastName };
      res.send(crypto.generateJWT(userDetails));
    } else {
      res.status(401).send("Incorrect password");
    }
  }
});

app.get("/initiate-transfer", authMiddleware, (req, res) => {
  console.log(req.user);
  res.send("Transfer initiated");
});
