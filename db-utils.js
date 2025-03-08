const { MongoClient } = require("mongodb");
// Replace the uri string with your connection string.
const uri =
  "mongodb+srv://riwajprasai:%23mypassword@payo-cluster.zlopg.mongodb.net/?retryWrites=true&w=majority&appName=payo-cluster";

const client = new MongoClient(uri);

const db = client.db("payo-database");
const usersDb = db.collection("users");

const createUser = async (user) => {
  await client.connect();

  console.log(user);
  usersDb.insertOne(user);
};

module.exports = {
  createUser,
};
