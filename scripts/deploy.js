const hre = require("hardhat");

async function main() {
  console.log("Deploying SimpleSplitBill contract...");
  
  // Get the contract factory
  const SimpleSplitBill = await hre.ethers.getContractFactory("SimpleSplitBill");
  
  // Deploy contract
  const bill = await SimpleSplitBill.deploy();
  
  // Wait for deployment
  await bill.deployed();
  
  console.log("✅ SimpleSplitBill deployed to:", bill.address);
  console.log("\nAdd this address to your frontend App.js");
  console.log(`CONTRACT_ADDRESS = "${bill.address}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});