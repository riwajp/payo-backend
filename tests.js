const crypto = require("./utils/crypto-utils");

const testTransaction = async () => {
  const transactionData = {
    username: "riwajp",
    amount: 20,
    timestamp: new Date().getTime(),
    currentBalance: 120,
  };

  console.log("Transaction data:", transactionData);

  const transactionHash = await crypto.hashLargeData(
    JSON.stringify({
      ...transactionData,
      seed: 12345678901,
    })
  );

  await setTimeout(async () => {
    console.log("Waited for  seconds");
    const recieverUsername = "riwajprasai";

    const transactionStatus = await crypto.verifyTransaction(
      transactionData,
      transactionHash
    );
    console.log(transactionStatus);
  }, 400);

  return;
  if (transactionData.error) {
    console.log(transactionData.error);
  } else {
    await db.transferFunds(
      transactionData.username,
      recieverUsername,
      transactionData.amount
    );
  }
};

testTransaction();
