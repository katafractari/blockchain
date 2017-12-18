// @flow
const crypto = require('crypto');
const url = require('url');
const request = require('request-promise');

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
  blockchain.nodes = new Set();
  newBlock(blockchain, 100, 1)
};

const registerNode = (blockchain, nodeUrl) => {
  const parsedUrl = url.parse(nodeUrl);
  blockchain.nodes.add(parsedUrl.host);
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

const validChain = (chain) => {
  if(chain.length === 0) {
    return false;
  }
  let lastBlock = chain[0];
  let index = 1;

  while(index < chain.length) {
    let block = chain[index];

    if(block['previousHash'] !== hash(lastBlock)) {
      return false;
    }

    if(validProof(lastBlock['proof'], block['proof'])) {
      return false;
    }

    lastBlock = block;
    index += 1;
  }

  return true;
};

const resolveConflicts = async (blockchain) => {
  let newChain;
  let maxLength = blockchain.chain.length;

  for(let nodeHost of blockchain.nodes) {
    let response = await request.get(`http://${nodeHost}/chain`);
    let json = JSON.parse(response);
    let length = json.length;
    let chain = json.chain;
    console.log(chain);

    if (length > maxLength && validChain(chain)) {
      maxLength = length;
      newChain = chain;
    }
  }
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
  newBlock: newBlock,
  registerNode: registerNode,
  resolveConflicts: resolveConflicts
};
