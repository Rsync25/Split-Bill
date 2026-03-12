import hre from "hardhat";

async function main() {
  console.log("Deploying SimpleSplitBill contract...");
  
  const SimpleSplitBill = await hre.ethers.getContractFactory("SimpleSplitBill");
  const bill = await SimpleSplitBill.deploy();
  
  await bill.deployed();
  
  console.log("✅ SimpleSplitBill deployed to:", bill.address);
  console.log("\nAdd this address to your frontend App.js");
  console.log(`CONTRACT_ADDRESS = "${bill.address}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});