
# Simple Escrow 🔒

<img width="840" height="200" alt="image" src="https://github.com/user-attachments/assets/56cc87b8-3104-4ac0-8653-8f9ba1f6bf64" />

Demo project for Final Project on Rootstock Dev Course

## 📋 **Project Overview**

**Simple Escrow** is a minimal, educational smart contract that demonstrates **time-based escrow** - a fundamental blockchain primitive where funds are held until both parties approve OR a deadline passes for refund.

**Core Primitive:** Time-based state machine with multi-party approval

**Key Concept:** Funds are held in the contract until:
- ✅ Both parties approve (success) → funds go to payee
- ⏰ Deadline passes without full approval → payer gets refund

---

## 📍 **Contract Deployment**

- **Network:** RSK Testnet
- **Contract Address:** `0x24a9f4ba13a490f7165725d311bb668814edb8d1`
- **Explorer Link:** [View on RSK Explorer](https://explorer.testnet.rootstock.io/address/0x24a9f4ba13a490f7165725d311bb668814edb8d1)
- **Contract Verified:** ✅

---

## ✅ **Features**

- ✅ Smart contract deployed on RSK Testnet
- ✅ Create escrow with single payee
- ✅ Deposit RBTC to escrow
- ✅ Release funds to approval state
- ✅ Approve from both parties (payer + payee)
- ✅ Automatic completion when both approve
- ✅ Refund after deadline passes

---

## 🔄 **How It Works**

### **State Machine:**
```
AWAITING_PAYMENT → AWAITING_APPROVAL → COMPLETED
                                   ↘ EXPIRED
```

### **User Flows:**

**Happy Path (Success):**
1. Payer creates escrow with RBTC deposit
2. Payer releases funds to contract
3. Payer approves
4. Payee approves
5. Funds automatically sent to payee

**Refund Path (Dispute/No Action):**
1. Payer creates escrow
2. Payer releases funds
3. Deadline passes (e.g., 7 days)
4. Payer calls refund
5. Funds returned to payer

---

## 🧪 **How to Test**

1. **Connect MetaMask to RSK Testnet**
   - Network: RSK Testnet
   - Chain ID: 31
   - RPC: https://public-node.testnet.rsk.co

2. **Get tRBTC from faucet**
   - Visit [RSK Faucet](https://faucet.rsk.co/)
   - Enter your wallet address
   - Request funds

3. **Create an escrow**
   - Enter title, payee address, amount, deadline
   - Confirm MetaMask transaction

4. **Release and approve**
   - Click "Release" to move funds to approval state
   - Approve from payer account
   - Switch to payee account in MetaMask
   - Approve from payee account

5. **Complete**
   - Funds automatically transfer to payee
   - Status shows "Completed"

---

## 🎯 **Why This Design?**

| Design Choice | Reason |
|---------------|--------|
| **Two parties only** | Clear responsibility, easier to understand |
| **4-state machine** | Complete coverage of all scenarios |
| **Separate release & approve** | Explicit intent, safety net |
| **Time-based refund** | No external oracles needed |
| **No DeFi features** | Focus on one primitive, matches feedback |

---

## 📁 **Project Structure**

```
split-bill/
├── contracts/
│   └── SimpleEscrow.sol      # ~120 lines - core escrow logic
├── frontend/
│   └── src/
│       ├── App.js            # React frontend
│       └── abis/
│           └── SimpleEscrow.json
├── scripts/
│   └── deploy.js             # Deployment script
├── test/
│   └── SimpleEscrow.test.js
├── hardhat.config.js
└── package.json
```

---

## 🛠 **Tech Stack**

| Component | Technology |
|-----------|------------|
| Smart Contract | Solidity 0.8.20 |
| Development | Hardhat |
| Frontend | React + Ethers.js |
| Wallet | MetaMask |
| Network | RSK Testnet |

---

## 🚀 **Run Locally**

```bash
# Clone repository
git clone https://github.com/Rsync25/Split-Bill.git
cd Split-Bill

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Compile contracts
npx hardhat compile

# Deploy to RSK Testnet
npx hardhat run scripts/deploy.js --network rskTestnet

# Run frontend
cd frontend
npm start
```

---

## 📊 **Rules Enforced**

| Rule | How It's Enforced |
|------|-------------------|
| Only payer can create/release/refund | `require(msg.sender == escrow.payer)` |
| Only payer/payee can approve | `require(msg.sender == payer OR payee)` |
| Cannot approve twice | `require(!escrow.payerApproved)` |
| Cannot approve before release | State must be `AWAITING_APPROVAL` |
| Refund only after deadline | `require(block.timestamp > deadline)` |

---

## 📝 **Capstone Requirements**

| Requirement | How This Project Meets It |
|-------------|--------------------------|
| **One clear primitive** | Time-based escrow state machine |
| **Not product-oriented** | Focuses on mechanism, not platform |
| **Educational value** | Demonstrates state management, time-based logic |
| **Complete but simple** | 4 states, 5 functions, ~120 lines |
| **Demo-friendly** | 2-minute walkthrough shows both paths |
| **Deployed on RSK** | Testnet deployment verified |

---

## 🔗 **Links**

- **Contract Address:** `0x24a9f4ba13a490f7165725d311bb668814edb8d1` (RSK Testnet)
- **Explorer:** [View Contract](https://explorer.testnet.rootstock.io/address/0x24a9f4ba13a490f7165725d311bb668814edb8d1)
- **GitHub:** [github.com/Rsync25/Split-Bill](https://github.com/Rsync25/Split-Bill)

---

## 📞 **Contact**

For questions about this project, please reach out via the course platform.

---

**Made for RSK Developer Course Capstone Project** 🚀

---
