import "@nomicfoundation/hardhat-ethers"; // ✅ Hardhat 3 plugin
import dotenv from "dotenv";

dotenv.config();

const config = {
  solidity: "0.8.20",
  networks: {
    rskTestnet: {
      url: "https://public-node.testnet.rsk.co",
      chainId: 31,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};

export default config;