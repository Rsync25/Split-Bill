import hre from "hardhat";

async function main() {
  console.log("Deploying SimpleEscrow contract...");
  
  const SimpleSplitBill = await hre.ethers.getContractFactory("SimpleSplitBill");
  const bill = await SimpleEscrow.deploy();
  
  await bill.deployed();
  
  console.log("✅ SimpleEscrowd deployed to:", bill.address);
}

main().catch(console.error);