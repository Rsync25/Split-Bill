#!/bin/bash
echo "🔍 Checking escrow count..."
npx hardhat console --network rskTestnet <<EOF
const contract = await ethers.getContractAt("SimpleEscrow", "0xYOUR_ADDRESS");
const count = await contract.escrowCount();
console.log("Total escrows:", count.toString());
const details = await contract.getEscrow(1);
console.log("Latest escrow:", details.title);
.exit
EOF