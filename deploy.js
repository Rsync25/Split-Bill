const hre = require("hardhat");

async function main() {
  console.log("Deploying SimpleSplitBill contract...");
  
  const SimpleSplitBill = await hre.ethers.getContractFactory("SimpleSplitBill");
  const bill = await SimpleSplitBill.deploy();
  
  await bill.deployed(); // ethers v5 uses deployed(), not waitForDeployment()
  
  console.log("✅ SimpleSplitBill deployed to:", bill.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});