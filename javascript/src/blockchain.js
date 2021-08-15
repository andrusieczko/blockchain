const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction {
  constructor(fromAddress, toAddress, amount) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
  }

  calculateHash() {
    return SHA256([this.fromAddress, this.toAddress, this.amount].join("")).toString();
  }

  signTransaction(signingKey) {
    if (signingKey.getPublic('hex') !== this.fromAddress) {
      throw new Error('Signing key does not belong to this wallet!');
    }

    const hash = this.calculateHash();
    const signature = signingKey.sign(hash, 'base64');
    this.signature = signature.toDER('hex');
  }

  isValid() {
    if (this.fromAddress == null) {
      return true;
    }

    if (!this.signature ||  this.signature.length === 0) {
      throw new Error('Wrong signature!');
    }

    const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
    return publicKey.verify(this.calculateHash(), this.signature); 
  }
}

class Block {
  constructor(previousHash, timestamp, transactions) {
    this.previousHash = previousHash;
    this.transactions = transactions;
    this.timestamp = timestamp;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  calculateHash() {
    return SHA256([this.previousHash, this.timestamp, JSON.stringify(this.transactions), this.nonce].join("")).toString();
  }

  mine(difficulty) {  
    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }

  hasValidTransactions() {
    for(let transaction of this.transactions) {
      if (!transaction.isValid()) {
        return false;
      }
    }
    return true;
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.getGenesisBlock()];
    this.difficulty = 2;

    this.pendingTransactions = [];
    this.rewardAmount = 100;
  }

  getGenesisBlock() {
    return new Block(null, new Date(), "Genesis block");
  }

  minePendingTransactions(miningRewardAddress) {
    const lastBlock = this.chain[this.chain.length - 1];

    const selectedTransactions = this.selectPendingTransactions();
    const newBlock = new Block(lastBlock.hash, new Date(), selectedTransactions);
    newBlock.mine(this.difficulty);
    
    console.log(`Block mined (${newBlock.transactions.length} transactions)`, newBlock.hash);

    this.chain.push(newBlock);

    this.pendingTransactions = [new Transaction(null, miningRewardAddress, this.rewardAmount)];
  }

  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Transaction must have a from and to address');
    }

    if (!transaction.isValid()) {
      throw new Error('Transaction is invalid!');
    }

    this.pendingTransactions.push(transaction);
  }

  getBalance(address) {
    let balance = 0;

    for (let block of this.chain) {
      for (let transaction of block.transactions) {
        if (transaction.fromAddress === address) {
          balance -= transaction.amount;
        }
        if (transaction.toAddress === address) {
          balance += transaction.amount;
        }
      }
    }
    return balance;
  }

  selectPendingTransactions() {
    return this.pendingTransactions;
  }

  isValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const previousBlock = this.chain[i - 1];
      const currentBlock = this.chain[i];

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (!currentBlock.hasValidTransactions()) {
        return false;
      }
    }
    return true;
  }
}

module.exports.Blockchain = Blockchain;
module.exports.Transaction = Transaction;