'use strict';
const Web3 = require('web3');
const logger = require('./logging.js');

var web3;

const options = {
  transactionBlockTimeout: 600
};

if (process.env.NETWORK === 'dev') {
    web3 = new Web3(new Web3.providers.HttpProvider('http://' + process.env.GANACHE_HOST + ':7545'), null, options);
} else if (process.env.NETWORK === 'ropsten') {
    web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/' +
                                                    process.env.INFURA_KEY), null, options);
} else if (process.env.NETWORK === 'kovan') {
    web3 = new Web3(new Web3.providers.HttpProvider('https://kovan.infura.io/v3/' +
                                                    process.env.INFURA_KEY), null, options);
} else if (process.env.NETWORK === 'mainnet') {
    web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/' +
                                                    process.env.INFURA_KEY), null, options);
} else {
    logger.error("Network " + process.env.NETWORK + " not recognized");
    process.exit();
}

module.exports = web3;
