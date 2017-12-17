// @flow
const crypto = require('crypto');

const newTransaction = (blockchain, sender: string, recipient: string, amount: number) => {
  blockchain.currentTransactions.push({
    sender,
    recipient,
    amount
  });

  return blockchain.chain.length + 1;
};

const getLastBlock = (blockchain) => {
  return blockchain.chain[blockchain.chain.length - 1];
};

const initBlockchain = (blockchain) => {
  blockchain.chain = [];
  blockchain.currentTransactions = [];
  newBlock(blockchain, 100, 1)
};

const newBlock = (blockchain, proof, previousHash) => {
  const block: Block = {
    index: blockchain.chain.length + 1,
    timestamp: new Date().getTime(),
    transactions: blockchain.currentTransactions,
    proof: proof,
    previousHash: previousHash ? previousHash : hash(getLastBlock(blockchain))
  };

  blockchain.currentTransactions = [];
  blockchain.chain.push(block);
  return block;
};

const hash = (block: Block) => {
  const json: string = JSON.stringify(block, Object.keys(block).sort());
  return crypto.createHash('sha256').update(json).digest('hex');
};

const proofOfWork = (lastProof) => {
  let proof = 0;
  while (!validProof(lastProof, proof)) {
    proof += 1;
  }

  return proof;
};

const validProof = (lastProof, proof) => {
  let guess = `${lastProof}${proof}`;
  let guessHash = crypto.createHash('sha256').update(guess).digest('hex');
  if(guessHash.indexOf("0000") === 0) {
    console.log('guess', guess.toString());
    console.log(guessHash);
  }
  return guessHash.indexOf("0000") === 0;
};

module.exports = {
  initBlockchain: initBlockchain,
  newTransaction: newTransaction,
  getLastBlock: getLastBlock,
  proofOfWork: proofOfWork,
  hash: hash,
  newBlock: newBlock
};
