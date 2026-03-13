import hre from "hardhat";

async function main() {
  const contractAddress = "0xeA2B73659d766bC71d18aaCf924D6effA1f2bbbd";
  
  const SimpleSplitBill = await hre.ethers.getContractFactory("SimpleSplitBill");
  const contract = SimpleSplitBill.attach(contractAddress);
  
  console.log("Contract connected to:", contract.address);
  
  // Get contract info
  const billCount = await contract.billCount();
  console.log("Total bills created:", billCount.toString());
}

main().catch(console.error);