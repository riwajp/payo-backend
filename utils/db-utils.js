const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://riwajprasai:%23mypassword@payo-cluster.zlopg.mongodb.net/?retryWrites=true&w=majority&appName=payo-cluster";

const client = new MongoClient(uri);

const db = client.db("payo-database");
const usersDb = db.collection("users");
const transactionsDb = db.collection("transactions");

client.connect();

const createUser = async (user) => {
  console.log(user);
  usersDb.insertOne(user);
};

const getUser = async (username) => {
  await client.connect();

  return usersDb.findOne({ username });
};

const transferFunds = async (senderUsername, receiverUsername, amount) => {
  const sender = await getUser(senderUsername);
  const receiver = await getUser(receiverUsername);
  console.log(receiverUsername);
  sender.currentBalance -= amount;
  receiver.currentBalance += amount;
  await usersDb.updateOne(
    { username: senderUsername },
    {
      $set: {
        currentBalance: sender.currentBalance,
        latestTransactionTimestamp: new Date().getTime(),
      },
    }
  );
  await usersDb.updateOne(
    { username: receiverUsername },
    { $set: { currentBalance: receiver.currentBalance } }
  );
};
module.exports = {
  createUser,
  getUser,
  transferFunds,
};
