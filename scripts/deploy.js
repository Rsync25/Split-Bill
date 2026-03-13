import hre from "hardhat";

async function main() {
  console.log("Deploying SimpleSplitBill contract...");
  
  const SimpleSplitBill = await hre.ethers.getContractFactory("SimpleSplitBill");
  const bill = await SimpleSplitBill.deploy();
  
  await bill.deployed();
  
  console.log("✅ SimpleSplitBill deployed to:", bill.address);
}

main().catch(console.error);