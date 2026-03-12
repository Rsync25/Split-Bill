const hre = require("hardhat");

async function main() {
  const SimpleSplitBill = await hre.ethers.getContractFactory("SimpleSplitBill");
  const bill = await SimpleSplitBill.deploy();
  
  await bill.deployed();
  console.log("SimpleSplitBill deployed to:", bill.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
