# ETH Fees Report

Given a comma separated list of addresses or file with address list separated by newline, generate a report on the transaction fees paid per address.

The executable requires setting environment variables _INFURA_KEY_ (for web3), and _ETHERSCAN_KEY_ (for pulling transactions per address).

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
    $ export INFURA_KEY=<infura key>
    $ export ETHERSCAN_KEY=<etherscan key>
    $ gas_fees <address or file with address list> --from-date <start_date> --to-date 2020-04-01 <end_date>

  Options
    --network,      -n   Ethereum Network (mainnet|ropsten|kovan)     (default: mainnet)
    --from-date,    -f   Filter transfers after from this date        (default: 2014-01-01)
    --to-date,      -t   Filter transfers before this date            (default: now)
    --out,          -o   The output filename                          (default: report.csv)

  Examples
    $ gas_fees 0x03d09c5a44addca5491f0d293ff927a4c5655f40 --from-date 2020-01-01 --to-date 2020-07-01
    $ gas_fees list_of_addresses.txt --from-date 2020-01-01 --to-date 2020-07-01
```
### Output

The report is generated to ./report.csv

### Example
```
$ ETHERSCAN_KEY=<hidden> INFURA_KEY=<hidden> gas_fees 0x03D09C5A44ADdCa5491F0d293ff927a4c5655F40 --network ropsten
info: Scanning ropsten for 1 addresses from block 1 (2016-11-20T11:48:50Z) to 8305529 (2020-07-16T13:28:23Z)
info: Found 144 transactions
info: 0x03D09C5A44ADdCa5491F0d293ff927a4c5655F40 paid 0.053375437784528048 ETH from block 1 to 8305529 in 144 transactions
Done processing.
```

### Limitations

The Ethercan API will only return up to 10,000 transactions, and that is currently the largest report that will be generated.
