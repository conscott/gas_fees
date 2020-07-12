'use strict';
const memoize = require("memoizee");
const moment = require('moment');
const web3 = require('./web3_inst.js');

const timestampToDate = (timestamp) => {
  const date = moment.unix(timestamp);
  return date.utc().format();
};

const dateToTimestamp = (date) => {
  return moment(date).unix();
};

// Memoize getting block
const gb = async(blockNum) => {
  return await web3.eth.getBlock(blockNum, true);
};
const getBlock = memoize(gb);

// Memoize getting block timestamp
const gbt = async(blockNum) => {
  let block = await getBlock(blockNum);
  return timestampToDate(block.timestamp);
};
const getBlockDate = memoize(gbt);

// Find nearest block to given date
const getBlockByTime = async(targetDate) => {
  let targetTimestamp = dateToTimestamp(targetDate);
  let averageBlockTime = 13.5;
  const currentBlockNumber = await web3.eth.getBlockNumber();
  let block = await web3.eth.getBlock(currentBlockNumber);
  let blockNumber = currentBlockNumber;
  while(block.timestamp > targetTimestamp){
    let decreaseBlocks = (block.timestamp - targetTimestamp) / averageBlockTime;
    decreaseBlocks = parseInt(decreaseBlocks) + 1;
    blockNumber -= decreaseBlocks;
    if (blockNumber < 0) {
      blockNumber = 1;
    }
    block = await web3.eth.getBlock(blockNumber);
    if (blockNumber == 1) {
      return block;
    }
  }
  return block;
};

const getTx = async(txid) => {
  let txinfo = await web3.eth.getTransactionReceipt(txid);
  return txinfo;
};

// Memoize get transaction
const getTransaction = memoize(getTx);

module.exports = {
  timestampToDate,
  dateToTimestamp,
  getBlock,
  getBlockByTime,
  getBlockDate,
  getTransaction
};
