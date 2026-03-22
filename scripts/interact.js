import hre from "hardhat";

async function main() {
  const contractAddress = "0xeA2B73659d766bC71d18aaCf924D6effA1f2bbbd";
  
  const SimpleEscrow = await hre.ethers.getContractFactory("SimpleEscrow");
  const contract = SimpleEscrow.attach(contractAddress);
  
  console.log("Contract connected to:", contract.address);
  
  // Get contract info
  const billCount = await contract.billCount();
  console.log("Total bills created:", billCount.toString());
}

main().catch(console.error);