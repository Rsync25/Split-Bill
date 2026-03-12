import "@nomiclabs/hardhat-ethers";

const config = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 1337
    },
    rskTestnet: {
      url: "https://public-node.testnet.rsk.co",
      chainId: 31,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test"
  }
};

export default config;