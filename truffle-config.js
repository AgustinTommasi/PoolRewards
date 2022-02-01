const HDWalletProvider = require("@truffle/hdwallet-provider");
const fs = require("fs");
const mnemonic = fs.readFileSync(".secret").toString().trim();
const infura = fs.readFileSync(".infura").toString().trim();
module.exports = {
  networks: {
    development: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 7545, // Standard BSC port (default: none)
      network_id: "*", // Any network (default: none)
    },
    testnet: {
      provider: () =>
        new HDWalletProvider(
          mnemonic,
          `https://data-seed-prebsc-1-s1.binance.org:8545`
        ),
      network_id: 97,
      confirmations: 10,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
    rinkeby: {
      provider: function () {
        return new HDWalletProvider(mnemonic, infura);
      },
      network_id: 4,
      gas: 4500000,
      gasPrice: 10000000000,
    },
    bsc: {
      provider: () =>
        new HDWalletProvider(mnemonic, `https://bsc-dataseed1.binance.org`),
      network_id: 56,
      confirmations: 10,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    timeout: 1000000,
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.10", // Fetch exact version from solc-bin (default: truffle's version)
    },
  },
};
