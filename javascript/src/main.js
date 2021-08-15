const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const key = ec.genKeyPair();
const privateKey = key.getPrivate('hex');

const myKey = ec.keyFromPrivate(privateKey);
const walletAddress = myKey.getPublic('hex');

const { Blockchain, Transaction } = require("./blockchain");

const blockchain = new Blockchain();

const tx1 = new Transaction(walletAddress, 'address2', 1000);
tx1.signTransaction(myKey);
blockchain.addTransaction(tx1);

blockchain.minePendingTransactions("karol");
blockchain.minePendingTransactions("karol");

console.log("balance of wallet: ", blockchain.getBalance(walletAddress));
console.log("balance of receipient: ", blockchain.getBalance("address2"));
console.log("balance of karol: ", blockchain.getBalance("karol"));

console.log("is valid?", blockchain.isValid())