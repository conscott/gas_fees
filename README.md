# ETH Fees Report

Given a comma separated list of addresses or file with address list separated by newline, give a report on the transaction fees paid per address for a given time period.

The executable requires setting environment variables _Network_, _INFURA_KEY_ (for web3), and _ETHERSCAN_KEY_ (for pulling transactions per address).

### Install from NPM

```
npm install -g gas_fees
```

### Install from Source
```
git clone https://github.com/cache-token/gas_fees.git
cd gas_fees
npm install
npm link
```

### Usage
```
$ gas_fees -h

  Generate report of gas fees paid for address over time period

  Usage
    $ export NETWORK=<ropsten|mainnet>
    $ export INFURA_KEY=<infura key>
    $ export ETHERSCAN_KEY=<etherscan key>
    $ gas_fees <address or file with address list> --from-date <start_date> --to-date 2020-04-01 <end_date>

  Options
    --from-date,    -f   Filter transfers after from this date        (default: 2014-01-01)
    --to-date,      -t   Filter transfers before this date            (default: now)
    --out,          -o   The output filename                          (default: report.csv)

  Examples
    $ gas_fees 0x03d09c5a44addca5491f0d293ff927a4c5655f40 --from-date 2020-01-01 --to-date 2020-07-01
    $ gas_fees list_of_addresses.txt --from-date 2020-01-01 --to-date 2020-07-01
```
### Output

The report is generated to ./report.csv
