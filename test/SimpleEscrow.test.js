const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleEscrow", function () {
  let escrow;
  let payer, payee, other;

  beforeEach(async function () {
    [payer, payee, other] = await ethers.getSigners();
    
    const SimpleEscrow = await ethers.getContractFactory("SimpleEscrow");
    escrow = await SimpleEscrow.deploy();
    await escrow.deployed();
  });

  describe("Escrow Creation", function () {
    it("Should create escrow with correct details", async function () {
      const amount = ethers.utils.parseEther("0.01");
      const deadlineDays = 7;
      
      await expect(escrow.connect(payer).createEscrow(
        "Test Payment", 
        payee.address, 
        deadlineDays,
        { value: amount }
      )).to.emit(escrow, "EscrowCreated");
      
      const escrowDetails = await escrow.getEscrow(1);
      expect(escrowDetails.title).to.equal("Test Payment");
      expect(escrowDetails.amount).to.equal(amount);
      expect(escrowDetails.payer).to.equal(payer.address);
      expect(escrowDetails.payee).to.equal(payee.address);
      expect(escrowDetails.state).to.equal(0); // AWAITING_PAYMENT
    });
    
    it("Should fail if no RBTC sent", async function () {
      await expect(
        escrow.connect(payer).createEscrow("Test", payee.address, 7)
      ).to.be.revertedWith("Must send RBTC");
    });
  });

  describe("Release and Approve", function () {
    beforeEach(async function () {
      const amount = ethers.utils.parseEther("0.01");
      await escrow.connect(payer).createEscrow(
        "Test", payee.address, 7, { value: amount }
      );
      await escrow.connect(payer).release(1);
    });
    
    it("Should allow payer to approve", async function () {
      await expect(escrow.connect(payer).approve(1))
        .to.emit(escrow, "Approved");
      
      const details = await escrow.getEscrow(1);
      expect(details.payerApproved).to.be.true;
    });
    
    it("Should complete when both approve", async function () {
      await escrow.connect(payer).approve(1);
      await expect(escrow.connect(payee).approve(1))
        .to.emit(escrow, "Completed");
      
      const details = await escrow.getEscrow(1);
      expect(details.state).to.equal(2); // COMPLETED
    });
    
    it("Should not allow non-participant to approve", async function () {
      await expect(escrow.connect(other).approve(1))
        .to.be.revertedWith("Not authorized");
    });
  });
});