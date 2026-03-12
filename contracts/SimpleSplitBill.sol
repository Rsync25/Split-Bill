// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleSplitBill {
    struct Bill {
        string title;
        uint totalAmount;
        uint deadline;
        address creator;
        mapping(address => bool) hasPaid;
        address[] participants;
        bool settled;
    }
    
    mapping(uint => Bill) public bills;
    uint public billCount;
    
    event BillCreated(uint billId, string title, uint amount, address creator);
    event PaymentReceived(uint billId, address payer, uint amount);
    event BillSettled(uint billId, address creator, uint amount);
    
    function createBill(
        string memory _title, 
        uint _totalAmount,
        uint _deadline,
        address[] memory _participants
    ) external returns (uint) {
        require(_participants.length > 0, "Need participants");
        
        billCount++;
        Bill storage bill = bills[billCount];
        bill.title = _title;
        bill.totalAmount = _totalAmount;
        bill.deadline = _deadline;
        bill.creator = msg.sender;
        bill.participants = _participants;
        
        emit BillCreated(billCount, _title, _totalAmount, msg.sender);
        return billCount;
    }
    
    function payBill(uint _billId) external payable {
        Bill storage bill = bills[_billId];
        require(block.timestamp <= bill.deadline, "Deadline passed");
        require(!bill.hasPaid[msg.sender], "Already paid");
        require(isParticipant(_billId, msg.sender), "Not a participant");
        
        uint amount = bill.totalAmount / bill.participants.length;
        require(msg.value >= amount, "Insufficient payment");
        
        bill.hasPaid[msg.sender] = true;
        emit PaymentReceived(_billId, msg.sender, msg.value);
    }
    
    function settleBill(uint _billId) external {
        Bill storage bill = bills[_billId];
        require(msg.sender == bill.creator, "Only creator");
        require(allPaid(_billId), "Not all paid");
        require(!bill.settled, "Already settled");
        
        bill.settled = true;
        payable(bill.creator).transfer(address(this).balance);
        
        emit BillSettled(_billId, bill.creator, address(this).balance);
    }
    
    function isParticipant(uint _billId, address _user) internal view returns (bool) {
        Bill storage bill = bills[_billId];
        for(uint i = 0; i < bill.participants.length; i++) {
            if(bill.participants[i] == _user) return true;
        }
        return false;
    }
    
    function allPaid(uint _billId) internal view returns (bool) {
        Bill storage bill = bills[_billId];
        for(uint i = 0; i < bill.participants.length; i++) {
            if(!bill.hasPaid[bill.participants[i]]) return false;
        }
        return true;
    }
    
    function getBill(uint _billId) external view returns (
        string memory title,
        uint totalAmount,
        uint deadline,
        address creator,
        address[] memory participants,
        bool settled,
        uint paidCount
    ) {
        Bill storage bill = bills[_billId];
        uint count = 0;
        for(uint i = 0; i < bill.participants.length; i++) {
            if(bill.hasPaid[bill.participants[i]]) count++;
        }
        return (
            bill.title,
            bill.totalAmount,
            bill.deadline,
            bill.creator,
            bill.participants,
            bill.settled,
            count
        );
    }
}
