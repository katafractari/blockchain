const express = require('express');
const app = express();
var bodyParser = require('body-parser');
const uuid = require('uuid');
const { initBlockchain, newTransaction, getLastBlock, proofOfWork, hash, newBlock } = require('./blockchain');

app.use(bodyParser.json());

const nodeUid = uuid.v4().replace(/-/g, '');

const blockchain = {};
initBlockchain(blockchain);

app.post('/mine', (req, res) => {
  console.log('We will mine a new block');

  const lastBlock = getLastBlock(blockchain);
  const lastProof = lastBlock['proof'];
  const proof = proofOfWork(lastProof);
  console.log('lastProof', lastProof);
  console.log('proof', proof);

  newTransaction(blockchain, "0", nodeUid, 1);

  const previousHash = hash(lastBlock);
  console.log(previousHash)
  const block = newBlock(blockchain, proof, previousHash);

  res.json({
    'message': "New Block Forged",
    'index': blockchain.chain.length + 1,
    'transactions': blockchain.chain[blockchain.chain.length - 1]['transactions'],
    'proof': block['proof'],
    'previous_hash': block['previous_hash'],
  });
});

app.post('/transactions/new', (req, res) => {
  console.log('We will add a transaction');

  const index = newTransaction(blockchain, req.body.sender, req.body.recipient, req.body.amount);
  res.send("Transaction will be added to block " + index);
});

app.get('/chain', (req, res) => {
  res.jsonp({
    chain: blockchain.chain,
    length: blockchain.chain.length
  });
});

app.listen(3000, () => console.log('Magic happening on port 3000!'));

