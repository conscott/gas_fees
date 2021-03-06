const request = require('request');
const logger = require('./logging.js');

var API;
if (process.env.NETWORK === 'ropsten') {
  API = 'https://api-ropsten.etherscan.io/api';
} else if (process.env.NETWORK === 'kovan') {
  API = 'https://api-kovan.etherscan.io/api';
} else {
  API = 'https://api.etherscan.io/api';
}

if (!process.env.ETHERSCAN_KEY) {
  console.log('Need to set ETHERSCAN_KEY environment variable');
  process.exit();
}

const API_KEY = process.env.ETHERSCAN_KEY;

const getTransactionsByAddress = async (addr, fromBlock, toBlock) => {
  return new Promise((resolve, reject) => {
    let url = (
      API +
      '?module=account&action=txlist&address=' + addr +
      '&startblock=' + fromBlock +
      '&endblock=' + toBlock +
      '&sort=asc&apikey=' + API_KEY
    );
    request(url, async(err, res, body) => {
      if (err) {
        logger.error(err);
        return reject(err);
      }
      return resolve(JSON.parse(body).result);
    });
  });
};

module.exports = { getTransactionsByAddress };
