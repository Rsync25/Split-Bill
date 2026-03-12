import "@nomiclabs/hardhat-ethers";
import dotenv from "dotenv";

dotenv.config();

export default {
  solidity: "0.8.20",
  networks: {
    rskTestnet: {
      url: "https://public-node.testnet.rsk.co",
      chainId: 31,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};