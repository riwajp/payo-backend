const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://riwajprasai:%23mypassword@payo-cluster.zlopg.mongodb.net/?retryWrites=true&w=majority&appName=payo-cluster";

const client = new MongoClient(uri);

const db = client.db("payo-database");
const usersDb = db.collection("users");

client.connect();

const createUser = async (user) => {
  console.log(user);
  usersDb.insertOne(user);
};

const getUser = async (username) => {
  await client.connect();

  return usersDb.findOne({ username });
};

module.exports = {
  createUser,
  getUser,
};
