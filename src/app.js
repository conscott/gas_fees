const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const BigNumber = require('bignumber.js');

const coingecko = require('./coingecko_client.js');
const etherscan = require('./etherscan_client.js');
const logger = require('./logging.js');
const utils = require('./transaction_utils.js');

// Set BigNumber to round down
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_DOWN });

// Globals to be filled in
var totalFees = new BigNumber(0);
var csvWriter;
var outFile;
var tokenCompare = false;

const processTransaction = async(tx, feeInfo) => {
  //console.log(JSON.stringify(tx, null, 4));
  const gasLimit = BigNumber(tx.gas);
  const gasPrice = BigNumber(tx.gasPrice);
  const gasUsed = BigNumber(tx.gasUsed);
  // in ETH
  const gasFee = gasPrice.times(gasUsed).div(BigNumber(10**18));
  totalFees = totalFees.plus(gasFee);
  const txData = {
    address: tx.from,
    txid: tx.hash,
    failed: tx.isError === '1',
    blockNum: tx.blockNumber,
    blockTime: utils.timestampToDate(tx.timeStamp),
    gasPrice: gasPrice.div(10**9).toString(),  // show in Gwei
    gasLimit: gasLimit.toString(),
    gasUsed: gasUsed.toString(),
    gasFee: gasFee.toFixed(18),
    total: totalFees.toFixed(18)
  };

  let record = {...txData, ...feeInfo};
  await csvWriter.writeRecords([record]);
};

const scanFees = async(addrs, fromBlock, toBlock, startTime, sym) => {

  // First fetch price data needed for report
  let ethHistory;
  let tokenHistory;
  if (tokenCompare) {
    await coingecko.initCoins();
    // pull prices from day before
    let days = parseInt((utils.dateToTimestamp() -  startTime) / (3600 * 24)) + 1;
    console.log(`Pulling ETH and ${sym} price history from ${days} ago`);
    ethHistory = await coingecko.getPriceHistory('eth', days, 'usd');
    tokenHistory = await coingecko.getPriceHistory(sym, days, 'usd');
  }
  for (let addr of addrs) {
    let transactions = await etherscan.getTransactionsByAddress(addr, fromBlock, toBlock);
    const total = transactions.length;
    logger.info("Found " + total + " transactions");
    let idx = 0;
    for (let tx of transactions) {
      idx++;
      if (idx % 1000 === 0) {
        logger.info("Have processed " + idx + " / " + total + " transactions");
      }
      let feeInfo = {};
      if (tokenCompare) {
        const ethPrice = coingecko.getPriceAtTime(ethHistory, tx.timeStamp);
        const tokenPrice = coingecko.getPriceAtTime(tokenHistory, tx.timeStamp);
        const gasFee = BigNumber(tx.gasPrice).times(tx.gasUsed).div(BigNumber(10**18));
        const feeUsd = gasFee.times(ethPrice);
        const feeToken = tokenPrice > 0 ? feeUsd.div(tokenPrice) : 0.0;
        feeInfo = {
          token: sym,
          ethPrice: ethPrice,
          tokenPrice: tokenPrice,
          feeUsd: feeUsd.toFixed(2),
          feeToken: feeToken.toFixed(8)
        };
      }
      await processTransaction(tx, feeInfo);
    }
    logger.info(`${addr} paid ${totalFees} ETH from block ${fromBlock} to ${toBlock} in ${transactions.length} transactions`);
    totalFees = new BigNumber(0);
  }

  console.log("Done processing.");
  process.exit();
};

const parseAddresses = (file) => {
  return fs.readFileSync(file).toString('utf-8').split("\n").filter(String).map( i => i.toLowerCase() );
};

const run = async(addresses, args) => {
  let addrs;
  if (fs.existsSync(addresses)) {
    addrs = parseAddresses(addresses);
  } else {
    addrs = addresses.split(',');
  }
  let startDate = new Date(args.fromDate);
  let endDate = new Date(args.toDate);
  outFile = args.out;
  tokenCompare = args.sym || false;

  const startBlock = (await utils.getBlockByTime(startDate));
  const endBlock = (await utils.getBlockByTime(endDate));
  const startBlockNum = startBlock.number;
  const endBlockNum = endBlock.number;
  const startBlockTime = utils.timestampToDate(startBlock.timestamp);
  const endBlockTime = utils.timestampToDate(endBlock.timestamp);

  logger.info("Scanning " + args.network + " for " + addrs.length + " addresses from block " +
              startBlockNum + " (" + startBlockTime + ")" + " to " +
              endBlockNum + " (" + endBlockTime + ")");

  if (!tokenCompare) {
    csvWriter = createCsvWriter({
      path: outFile,
      header: [
        {id: 'address', title: 'Address'},
        {id: 'txid', title: 'Txid'},
        {id: 'failed', title: 'failed'},
        {id: 'blockNum', title: 'Block Number'},
        {id: 'blockTime', title: 'Block Time'},
        {id: 'gasPrice', title: 'gasPrice Gwei'},
        {id: 'gasLimit', title: 'gasLimit'},
        {id: 'gasUsed', title: 'gasUsed'},
        {id: 'gasFee', title: 'GasPaid ETH'},
        {id: 'total', title: 'Total So Far'},
      ]
    });
  } else {
    csvWriter = createCsvWriter({
      path: outFile,
      header: [
        {id: 'address', title: 'Address'},
        {id: 'txid', title: 'Txid'},
        {id: 'failed', title: 'failed'},
        {id: 'blockNum', title: 'Block Number'},
        {id: 'blockTime', title: 'Block Time'},
        {id: 'gasPrice', title: 'gasPrice Gwei'},
        {id: 'gasLimit', title: 'gasLimit'},
        {id: 'gasUsed', title: 'gasUsed'},
        {id: 'gasFee', title: 'GasPaid ETH'},
        {id: 'token', title: 'Token Symbol'},
        {id: 'ethPrice', title: 'ETH USD Price at Time'},
        {id: 'tokenPrice', title: 'Token USD Price at Time'},
        {id: 'feeUsd', title: 'Fee in USD'},
        {id: 'feeToken', title: 'Fee in Token Amount'},
      ]
    });
  }
  await scanFees(addrs, startBlockNum, endBlockNum, startBlock.timestamp, args.sym);
};

module.exports = run;
