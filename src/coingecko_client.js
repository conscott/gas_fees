const CoinGecko = require('coingecko-api');
const assert = require('assert');
const utils = require('./transaction_utils.js');

const cgc = new CoinGecko();

let coins;
const initCoins = async() => {
  coins = (await cgc.coins.list()).data;
};

const getCoinId = (sym) => {
  assert(coins, 'Must call initCoins() first');
  for (let coin of coins) {
    if (sym.toLowerCase() === coin.symbol.toLowerCase()) {
      return coin.id;
    }
  }
  console.error(`Could not find coin-id for symbol ${sym}`);
  return null;
};

const getPriceHistory = async(sym, days, currency) => {
  currency = currency || 'usd';
  let coinid = getCoinId(sym);
  if (!coinid) {
    return [];
  }
  let history  = await cgc.coins.fetchMarketChart(coinid, {days: days, vs_currency: currency});
  return history.data.prices;
};

// Assume: time1 < target
//         target < time2
const closerTime = (h1, h2, target) => {
  return ((h2[0] / 1000) - target) <= (target - (h1[0] / 1000)) ? h2[1] : h1[1];
};

const getPriceAtTime = (priceHistory, time) => {
  if (!priceHistory.length || !time) {
    return 0.0;
  }
  if (time instanceof Date) {
    time = utils.dateToTimestamp(time);
  }
  let idx = 0;
  while ((priceHistory[idx][0] / 1000) <  time) {
    idx++;
    if (idx >= priceHistory.length) {
      return priceHistory[idx-1][1];
    }
  }
  if (idx == 0) {
    console.error(`Do not have enough price history, target ${utils.timestampToDate(time)} and oldest record is ${utils.timestampToDate(priceHistory[0][0]/1000)}`);
    process.exit();
  }
  //console.log(`${priceHistory[idx-1][0] / 1000} vs ${time} ${priceHistory[idx-1][1]}`);
  //console.log(`${priceHistory[idx][0] / 1000} vs ${time} ${priceHistory[idx][1]}`);
  return closerTime(priceHistory[idx-1], priceHistory[idx], time);
};

module.exports = {
  initCoins,
  getPriceHistory,
  getPriceAtTime
};
