const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const BigNumber = require('bignumber.js');

const etherscan = require('./etherscan_client.js');
const logger = require('./logging.js');
const utils = require('./transaction_utils.js');

// Set BigNumber to round down
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_DOWN });

// Globals to be filled in
var totalFees = new BigNumber(0);
var csvWriter;
var outFile;

const processTransaction = async(tx) => {
  //console.log(JSON.stringify(tx, null, 4));
  const gasLimit = BigNumber(tx.gas);
  const gasPrice = BigNumber(tx.gasPrice);
  const gasUsed = BigNumber(tx.gasUsed);
  // in ETH
  const gasFee = gasPrice.times(gasUsed).div(BigNumber(10**18));
  totalFees = totalFees.plus(gasFee);
  const data = [{
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
  }];
  await csvWriter.writeRecords(data);
};

const scanFees = async(addrs, fromBlock, toBlock) => {
  for (let addr of addrs) {
    let transactions = await etherscan.getTransactionsByAddress(addr, fromBlock, toBlock);
    const total = transactions.length;
    logger.info("Found " + total + " transactions");
    let idx = 0;
    for (let transaction of transactions) {
      idx++;
      if (idx % 1000 === 0) {
        logger.info("Have processed " + idx + " / " + total + " transactions");
      }
      await processTransaction(transaction);
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

  const startBlock = (await utils.getBlockByTime(startDate));
  const endBlock = (await utils.getBlockByTime(endDate));
  const startBlockNum = startBlock.number;
  const endBlockNum = endBlock.number;
  const startBlockTime = utils.timestampToDate(startBlock.timestamp);
  const endBlockTime = utils.timestampToDate(endBlock.timestamp);

  logger.info("Scanning " + args.network + " for " + addrs.length + " addresses from block " +
              startBlockNum + " (" + startBlockTime + ")" + " to " +
              endBlockNum + " (" + endBlockTime + ")");

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
  await scanFees(addrs, startBlockNum, endBlockNum);
};

module.exports = run;
