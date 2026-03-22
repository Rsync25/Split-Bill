#!/bin/bash
echo "🔍 Checking escrow count..."
npx hardhat console --network rskTestnet <<EOF
const contract = await ethers.getContractAt("SimpleEscrow", "0x24a9f4ba13a490f7165725d311bb668814edb8d1");
const count = await contract.escrowCount();
console.log("Total escrows:", count.toString());
const details = await contract.getEscrow(1);
console.log("Latest escrow:", details.title);
.exit
EOF