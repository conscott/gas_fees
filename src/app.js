require('./load_config.js').loadConfig();
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
  const gas = BigNumber(tx.gas);
  const gasPrice = BigNumber(tx.gasPrice)
  // in ETH
  const gasFee = gasPrice.times(gas).div(BigNumber(10**18));
  totalFees = totalFees.plus(gasFee);
  const data = [{
    address: tx.from,
    txid: tx.hash,
    blockNum: tx.blockNumber,
    blockTime: utils.timestampToDate(tx.timeStamp),
    gasPrice: gasPrice.div(10**9).toString(),  // show in Gwei
    gas: gas.toString(),
    gasFee: gasFee.toFixed(18),
    total: totalFees.toFixed(18)
  }];
  await csvWriter.writeRecords(data);
};

const scanFees = async(addrs, fromBlock, toBlock) => {
  for (let addr of addrs) {
    let transactions = await etherscan.getTransactionsByAddress(addr, fromBlock, toBlock);
    for (let transaction of transactions) {
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

  logger.info("Scanning " + process.env.NETWORK + " for " + addrs.length + " addresses from block " +
              startBlockNum + " (" + startBlockTime + ")" + " to " +
              endBlockNum + " (" + endBlockTime + ")");

  csvWriter = createCsvWriter({
    path: outFile,
    header: [
      {id: 'address', title: 'Address'},
      {id: 'txid', title: 'Txid'},
      {id: 'blockNum', title: 'Block Number'},
      {id: 'blockTime', title: 'Block Time'},
      {id: 'gasPrice', title: 'gasPrice Gwei'},
      {id: 'gas', title: 'gas Used'},
      {id: 'gasFee', title: 'Total Gas Fee ETH'},
      {id: 'total', title: 'Total So Far'},
    ]
  });
  await scanFees(addrs, startBlockNum, endBlockNum);
};

module.exports = run;
