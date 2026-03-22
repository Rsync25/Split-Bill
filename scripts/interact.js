const hre = require("hardhat");

async function main() {
  const contractAddress = "0x24a9f4ba13a490f7165725d311bb668814edb8d1"; // Replace this!
  
  console.log("🔌 Connecting to SimpleEscrow at:", contractAddress);
  
  const Escrow = await hre.ethers.getContractFactory("SimpleEscrow");
  const escrow = await Escrow.attach(contractAddress);
  
  // Get accounts
  const [payer, payee] = await hre.ethers.getSigners();
  
  console.log("\n📊 Accounts:");
  console.log("Payer:", await payer.getAddress());
  console.log("Payee:", await payee.getAddress());
  
  // Check contract stats
  const count = await escrow.escrowCount();
  console.log("\n📊 Total escrows created:", count.toString());
  
  // Create a new escrow
  console.log("\n💰 Creating new escrow...");
  const title = "CLI Test Escrow";
  const payeeAddress = await payee.getAddress();
  const deadlineDays = 7;
  const amount = hre.ethers.utils.parseEther("0.001");
  
  const createTx = await escrow.connect(payer).createEscrow(
    title, 
    payeeAddress, 
    deadlineDays, 
    { value: amount }
  );
  await createTx.wait();
  
  const newId = await escrow.escrowCount();
  console.log(`✅ Escrow #${newId} created!`);
  
  // Get and display escrow details
  const details = await escrow.getEscrow(newId);
  console.log("\n📋 Escrow #" + newId + ":");
  console.log("  Title:", details.title);
  console.log("  Amount:", hre.ethers.utils.formatEther(details.amount), "RBTC");
  console.log("  Payer:", details.payer);
  console.log("  Payee:", details.payee);
  console.log("  Deadline:", new Date(details.deadline * 1000).toLocaleString());
  console.log("  State:", ["Awaiting Payment", "Awaiting Approval", "Completed", "Expired"][details.state]);
  
  // Release funds
  console.log("\n🔓 Releasing funds...");
  const releaseTx = await escrow.connect(payer).release(newId);
  await releaseTx.wait();
  console.log("✅ Funds released to escrow!");
  
  // Approve as payer
  console.log("\n✅ Approving as payer...");
  const approvePayerTx = await escrow.connect(payer).approve(newId);
  await approvePayerTx.wait();
  console.log("✅ Payer approved!");
  
  // Approve as payee
  console.log("\n✅ Approving as payee...");
  const approvePayeeTx = await escrow.connect(payee).approve(newId);
  await approvePayeeTx.wait();
  console.log("✅ Payee approved!");
  
  // Final status
  const finalDetails = await escrow.getEscrow(newId);
  console.log("\n🎉 Final Status:", ["Awaiting Payment", "Awaiting Approval", "Completed", "Expired"][finalDetails.state]);
  console.log("💰 Funds have been sent to payee!");
  
  // Show balance changes
  const payerBalance = await hre.ethers.provider.getBalance(await payer.getAddress());
  const payeeBalance = await hre.ethers.provider.getBalance(await payee.getAddress());
  console.log("\n💎 Final Balances:");
  console.log("Payer:", hre.ethers.utils.formatEther(payerBalance), "RBTC");
  console.log("Payee:", hre.ethers.utils.formatEther(payeeBalance), "RBTC");
}

main().catch(console.error);