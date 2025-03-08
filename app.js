const express = require("express");
const db = require("./db-utils");
const crypto = require("./crypto-utils");

const app = express();
app.use(express.json());

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

app.post("/create-user", async (req, res) => {
  // create the random seed value
  const user = req.body;
  user.seed = crypto.getSeed();
  user.password = await crypto.hashPassword(user.password);
  await db.createUser(user);
  res.send({ seed: user.seed });
});

app.post("/initiate-transfer", (req, res) => {
  // initiate transfer
  res.send("Transfer initiated");
});
