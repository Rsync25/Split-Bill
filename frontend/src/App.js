import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Contract ABI (simplified)
const CONTRACT_ABI = [
  "function createBill(string memory _title, uint _totalAmount, uint _deadline, address[] memory _participants) external returns (uint)",
  "function payBill(uint _billId) external payable",
  "function settleBill(uint _billId) external",
  "function getBill(uint _billId) external view returns (string memory title, uint totalAmount, uint deadline, address creator, address[] memory participants, bool settled, uint paidCount)",
  "function billCount() external view returns (uint)"
];

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [participants, setParticipants] = useState('');
  
  const CONTRACT_ADDRESS = '0x...'; // Deploy and add your address here

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      setAccount(address);
      setContract(contract);
      loadBills(contract);
    } catch (error) {
      console.error(error);
    }
  };

  // Load bills
  const loadBills = async (contract) => {
    try {
      const count = await contract.billCount();
      const billList = [];
      
      for (let i = 1; i <= count; i++) {
        const bill = await contract.getBill(i);
        billList.push({
          id: i,
          title: bill.title,
          totalAmount: ethers.utils.formatEther(bill.totalAmount),
          deadline: new Date(bill.deadline * 1000).toLocaleString(),
          creator: bill.creator,
          participants: bill.participants,
          settled: bill.settled,
          paidCount: bill.paidCount.toString()
        });
      }
      
      setBills(billList);
    } catch (error) {
      console.error(error);
    }
  };

  // Create bill
  const createBill = async (e) => {
    e.preventDefault();
    if (!contract) return;
    
    setLoading(true);
    try {
      const participantList = participants.split(',').map(p => p.trim());
      const amountWei = ethers.utils.parseEther(amount);
      const deadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days
      
      const tx = await contract.createBill(title, amountWei, deadline, participantList);
      await tx.wait();
      
      alert('Bill created!');
      setTitle('');
      setAmount('');
      setParticipants('');
      loadBills(contract);
    } catch (error) {
      console.error(error);
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  // Pay bill
  const payBill = async (billId, amount) => {
    if (!contract) return;
    
    setLoading(true);
    try {
      const amountWei = ethers.utils.parseEther(amount);
      const tx = await contract.payBill(billId, { value: amountWei });
      await tx.wait();
      
      alert('Payment sent!');
      loadBills(contract);
    } catch (error) {
      console.error(error);
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  // Settle bill
  const settleBill = async (billId) => {
    if (!contract) return;
    
    setLoading(true);
    try {
      const tx = await contract.settleBill(billId);
      await tx.wait();
      
      alert('Bill settled!');
      loadBills(contract);
    } catch (error) {
      console.error(error);
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>💰 SplitBill Mini</h1>
      
      {!account ? (
        <button 
          onClick={connectWallet}
          style={styles.button}
        >
          Connect Wallet
        </button>
      ) : (
        <div>
          <p>Connected: {account.slice(0,6)}...{account.slice(-4)}</p>
          
          {/* Create Bill Form */}
          <div style={styles.card}>
            <h2>Create New Bill</h2>
            <form onSubmit={createBill}>
              <input
                type="text"
                placeholder="Title (e.g., Dinner)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={styles.input}
                required
              />
              <input
                type="number"
                step="0.001"
                placeholder="Total Amount (RBTC)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={styles.input}
                required
              />
              <input
                type="text"
                placeholder="Participants (comma-separated addresses)"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                style={styles.input}
                required
              />
              <button 
                type="submit" 
                disabled={loading}
                style={styles.button}
              >
                {loading ? 'Creating...' : 'Create Bill'}
              </button>
            </form>
          </div>
          
          {/* Bills List */}
          <div style={styles.card}>
            <h2>Bills</h2>
            {bills.length === 0 ? (
              <p>No bills yet</p>
            ) : (
              bills.map(bill => (
                <div key={bill.id} style={styles.billItem}>
                  <h3>{bill.title}</h3>
                  <p>Amount: {bill.totalAmount} RBTC</p>
                  <p>Deadline: {bill.deadline}</p>
                  <p>Paid: {bill.paidCount}/{bill.participants.length}</p>
                  <p>Creator: {bill.creator === account ? 'You' : bill.creator.slice(0,6)}</p>
                  
                  {!bill.settled && (
                    <div>
                      {bill.participants.includes(account) && !bill.settled && (
                        <button
                          onClick={() => payBill(bill.id, (bill.totalAmount / bill.participants.length).toString())}
                          disabled={loading}
                          style={{...styles.button, backgroundColor: '#10b981'}}
                        >
                          Pay My Share
                        </button>
                      )}
                      
                      {bill.creator === account && bill.paidCount === bill.participants.length && (
                        <button
                          onClick={() => settleBill(bill.id)}
                          disabled={loading}
                          style={{...styles.button, backgroundColor: '#f59e0b'}}
                        >
                          Settle Bill
                        </button>
                      )}
                    </div>
                  )}
                  
                  {bill.settled && <p style={{color: '#10b981'}}>✓ Settled</p>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  button: {
    backgroundColor: '#4f46e5',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    margin: '5px'
  },
  input: {
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    borderRadius: '5px',
    border: '1px solid #ddd'
  },
  card: {
    backgroundColor: '#f9fafb',
    padding: '20px',
    borderRadius: '10px',
    margin: '20px 0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  billItem: {
    border: '1px solid #e5e7eb',
    padding: '15px',
    borderRadius: '5px',
    margin: '10px 0'
  }
};

export default App;
