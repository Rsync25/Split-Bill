cat > scripts/deploy.js << 'EOF'
const hre = require("hardhat");

async function main() {
  console.log("Deploying SimpleEscrow contract...");
  
  // IMPORTANT: Use the correct contract name
  const Escrow = await hre.ethers.getContractFactory("SimpleEscrow");
  const escrow = await Escrow.deploy();
  
  await escrow.deployed();
  
  console.log("✅ SimpleEscrow deployed to:", escrow.address);
  console.log("\n📝 Add this address to your frontend App.js");
  console.log(`const CONTRACT_ADDRESS = "${escrow.address}";`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
EOF