const moment = require('moment');
const meow = require('meow');

module.exports = () => {
  const cli = meow(`
    Usage
      $ export INFURA_KEY=<infura key>
      $ export ETHERSCAN_KEY=<etherscan key>
      $ gas_fees <address or file with address list> --from-date <start_date> --to-date 2020-04-01 <end_date>

    Options
      --network,      -n   Ethereum Network (mainnet|ropsten|kovan)     (default: mainnet)
      --from-date,    -f   Filter transfers after from this date        (default: 2014-01-01)
      --to-date,      -t   Filter transfers before this date            (default: now)
      --show-usd      -u   Show fees paid in USD in report              (default: false)
      --sym           -s   If passed, compare gasFees to token price    (default: null)
      --out,          -o   The output filename                          (default: report.csv)

    Examples
      $ gas_fees 0x03d09c5a44addca5491f0d293ff927a4c5655f40 --from-date 2020-01-01 --to-date 2020-07-01
      $ gas_fees list_of_addresses.txt --from-date 2020-01-01 --to-date 2020-07-01
    `, {
    flags: {
      'network': {
        type: 'string',
        alias: 'n',
        default: 'mainnet'
      },
      'from-date': {
        type: 'string',
        alias: 'f',
        default: (new Date('2014-01-01')).toString()
      },
      'to-date': {
        type: 'string',
        alias: 't',
        default: (moment().subtract(60, 'seconds')).toString()
      },
      'out': {
        type: 'string',
        alias: '0',
        default: 'report.csv'
      },
      'show-usd': {
        type: 'boolean',
        alias: 'u',
        default: false
      },
      'sym': {
        type: 'string',
        alias: 's',
        default: ''
      },
      alias: { h: 'help', v: 'version' }
    }
  });

  let args = cli.flags;
  let addresses = cli.input[0];
  if ('h' in args || !addresses) {
    if (!addresses) { console.log("\n  Address list or file required!\n"); }
    console.log(cli.help);
    process.exit();
  }
  process.env.NETWORK = args.network;
  require('./src/app.js')(cli.input[0], args);
};
