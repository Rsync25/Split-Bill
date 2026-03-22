// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleEscrow {  // Just renamed
    struct Escrow {  // Renamed from Bill
        string title;
        uint totalAmount;
        uint deadline;
        address payer;  // Renamed from creator
        address payee;  // NEW FIELD
        mapping(address => bool) hasApproved;  // Renamed from hasPaid
        address[] participants;  // [payer, payee]
        bool settled;
    }
    
    mapping(uint => Escrow) public escrows;  // Renamed from bills
    uint public escrowCount;  // Renamed from billCount
    
    event EscrowCreated(uint escrowId, string title, uint amount, address payer, address payee);
    event Approved(uint escrowId, address approver);
    event Completed(uint escrowId, address payer, uint amount);
    
    function createEscrow(  // Renamed from createBill
        string memory _title, 
        uint _totalAmount,
        uint _deadline,
        address _payee  // NEW PARAMETER
    ) external returns (uint) {
        require(_payee != address(0), "Invalid payee");
        
        escrowCount++;
        Escrow storage escrow = escrows[escrowCount];
        escrow.title = _title;
        escrow.totalAmount = _totalAmount;
        escrow.deadline = _deadline;
        escrow.payer = msg.sender;
        escrow.payee = _payee;
        
        // Store both parties
        escrow.participants.push(msg.sender);
        escrow.participants.push(_payee);
        
        emit EscrowCreated(escrowCount, _title, _totalAmount, msg.sender, _payee);
        return escrowCount;
    }
    
    function approve(uint _escrowId) external payable {  // Renamed from payBill
        Escrow storage escrow = escrows[_escrowId];
        require(block.timestamp <= escrow.deadline, "Deadline passed");
        require(!escrow.settled, "Already settled");
        require(!escrow.hasApproved[msg.sender], "Already approved");
        require(isParticipant(_escrowId, msg.sender), "Not a participant");
        
        // Payers send funds, payees just approve
        if (msg.sender == escrow.payer) {
            require(msg.value >= escrow.totalAmount, "Must send full amount");
        }
        
        escrow.hasApproved[msg.sender] = true;
        emit Approved(_escrowId, msg.sender);
    }
    
    function complete(uint _escrowId) external {  // Renamed from settleBill
        Escrow storage escrow = escrows[_escrowId];
        require(msg.sender == escrow.payer, "Only payer");
        require(allApproved(_escrowId), "Not all approved");
        require(!escrow.settled, "Already settled");
        
        escrow.settled = true;
        payable(escrow.payee).transfer(address(this).balance);
        
        emit Completed(_escrowId, escrow.payer, address(this).balance);
    }
    
    function refund(uint _escrowId) external {  // NEW FUNCTION
        Escrow storage escrow = escrows[_escrowId];
        require(msg.sender == escrow.payer, "Only payer");
        require(block.timestamp > escrow.deadline, "Deadline not passed");
        require(!escrow.settled, "Already settled");
        require(!allApproved(_escrowId), "All approved - cannot refund");
        
        escrow.settled = true;
        payable(escrow.payer).transfer(address(this).balance);
    }
    
    function isParticipant(uint _escrowId, address _user) internal view returns (bool) {
        Escrow storage escrow = escrows[_escrowId];
        return (_user == escrow.payer || _user == escrow.payee);
    }
    
    function allApproved(uint _escrowId) internal view returns (bool) {
        Escrow storage escrow = escrows[_escrowId];
        return (escrow.hasApproved[escrow.payer] && escrow.hasApproved[escrow.payee]);
    }
    
    function getEscrow(uint _escrowId) external view returns (
        string memory title,
        uint totalAmount,
        uint deadline,
        address payer,
        address payee,
        bool settled,
        bool payerApproved,
        bool payeeApproved
    ) {
        Escrow storage escrow = escrows[_escrowId];
        return (
            escrow.title,
            escrow.totalAmount,
            escrow.deadline,
            escrow.payer,
            escrow.payee,
            escrow.settled,
            escrow.hasApproved[escrow.payer],
            escrow.hasApproved[escrow.payee]
        );
    }
}
