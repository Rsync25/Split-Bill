import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ContractABI from './abis/SimpleEscrow.json'; // Just renamed ABI file

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [escrows, setEscrows] = useState([]); // Renamed from bills
  const [loading, setLoading] = useState(false);
  
  // Form state - ADDED payee field
  const [title, setTitle] = useState('');
  const [payee, setPayee] = useState(''); // NEW FIELD
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  const CONTRACT_ADDRESS = '0xYourAddressHere'; // Same address

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Install MetaMask!');
      return;
    }
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ContractABI, signer);
      
      setAccount(address);
      setContract(contract);
      loadEscrows(contract, address); // Renamed from loadBills
    } catch (error) {
      console.error(error);
    }
  };

  // NEW FUNCTION - loads escrows instead of bills
  const loadEscrows = async (contract, address) => {
    try {
      const count = await contract.escrowCount(); // Changed from billCount
      const escrowList = [];
      
      for (let i = 1; i <= count; i++) {
        const escrow = await contract.getEscrow(i); // Changed from getBill
        // Show only escrows where user is involved
        if (escrow.payer === address || escrow.payee === address) {
          escrowList.push({
            id: i,
            title: escrow.title,
            totalAmount: ethers.utils.formatEther(escrow.totalAmount),
            deadline: new Date(escrow.deadline * 1000).toLocaleString(),
            payer: escrow.payer,
            payee: escrow.payee,
            settled: escrow.settled,
            payerApproved: escrow.payerApproved,
            payeeApproved: escrow.payeeApproved
          });
        }
      }
      setEscrows(escrowList);
    } catch (error) {
      console.error(error);
    }
  };

  // CHANGED - createEscrow instead of createBill
  const createEscrow = async (e) => {
    e.preventDefault();
    if (!contract) return;
    
    setLoading(true);
    try {
      // Convert days to timestamp
      const deadlineDays = parseInt(deadline);
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadlineDays * 24 * 60 * 60);
      
      const amountWei = ethers.utils.parseEther(amount);
      
      // Call createEscrow with payee parameter
      const tx = await contract.createEscrow(
        title, 
        amountWei, 
        deadlineTimestamp,
        payee, // NEW - payee address
        { value: amountWei }
      );
      
      await tx.wait();
      
      alert('Escrow created!'); // Changed message
      setTitle('');
      setPayee(''); // Clear new field
      setAmount('');
      setDeadline('');
      loadEscrows(contract, account);
    } catch (error) {
      console.error(error);
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  // RENAMED - approve instead of payBill
  const approve = async (id) => {
    setLoading(true);
    try {
      const tx = await contract.approve(id);
      await tx.wait();
      loadEscrows(contract, account);
    } catch (error) {
      console.error(error);
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  // RENAMED - complete instead of settleBill
  const complete = async (id) => {
    setLoading(true);
    try {
      const tx = await contract.complete(id);
      await tx.wait();
      loadEscrows(contract, account);
    } catch (error) {
      console.error(error);
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  // NEW FUNCTION - refund
  const refund = async (id) => {
    setLoading(true);
    try {
      const tx = await contract.refund(id);
      await tx.wait();
      loadEscrows(contract, account);
    } catch (error) {
      console.error(error);
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h1>🔒 Simple Escrow</h1> {/* Changed title */}
      
      {!account ? (
        <button onClick={connectWallet} style={styles.button}>
          Connect Wallet
        </button>
      ) : (
        <>
          <p>Connected: {account.slice(0,6)}...{account.slice(-4)}</p>
          
          {/* Create Escrow Form - ADDED payee field */}
          <div style={styles.card}>
            <h3>Create Escrow</h3> {/* Changed title */}
            <form onSubmit={createEscrow}>
              <input
                style={styles.input}
                placeholder="Title (e.g., Freelance Payment)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              
              {/* NEW FIELD - Payee Address */}
              <input
                style={styles.input}
                placeholder="Payee Address (0x...)"
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                required
              />
              
              <input
                style={styles.input}
                type="number"
                step="0.001"
                placeholder="Amount (RBTC)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              
              <input
                style={styles.input}
                type="number"
                placeholder="Deadline (days)"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
              
              <button 
                type="submit" 
                disabled={loading}
                style={styles.button}
              >
                {loading ? 'Creating...' : 'Create Escrow'}
              </button>
            </form>
          </div>
          
          {/* Escrows List - Renamed from Bills */}
          <div style={styles.card}>
            <h3>Your Escrows</h3> {/* Changed title */}
            {escrows.length === 0 ? (
              <p>No escrows yet</p>
            ) : (
              escrows.map(escrow => {
                const isPayer = escrow.payer === account;
                const isPayee = escrow.payee === account;
                const bothApproved = escrow.payerApproved && escrow.payeeApproved;
                const deadlinePassed = new Date(escrow.deadline) < new Date();
                
                return (
                  <div key={escrow.id} style={styles.escrowItem}>
                    <h4>{escrow.title} (#{escrow.id})</h4>
                    <p>Amount: <strong>{escrow.totalAmount} RBTC</strong></p>
                    <p>Payer: {escrow.payer === account ? 'You' : escrow.payer.slice(0,6)}</p>
                    <p>Payee: {escrow.payee === account ? 'You' : escrow.payee.slice(0,6)}</p>
                    <p>Deadline: {escrow.deadline}</p>
                    <p>Status: {
                      escrow.settled ? '✅ Settled' :
                      bothApproved ? '⏳ Ready to Complete' :
                      `${escrow.payerApproved ? '✅' : '❌'} Payer, ${escrow.payeeApproved ? '✅' : '❌'} Payee`
                    }</p>
                    
                    {/* Action Buttons */}
                    {!escrow.settled && (
                      <div>
                        {/* Approve button for both parties */}
                        {((isPayer && !escrow.payerApproved) || 
                          (isPayee && !escrow.payeeApproved)) && (
                          <button
                            onClick={() => approve(escrow.id)}
                            disabled={loading}
                            style={{...styles.smallButton, backgroundColor: '#4f46e5'}}
                          >
                            Approve
                          </button>
                        )}
                        
                        {/* Complete button for payer when both approved */}
                        {isPayer && bothApproved && !escrow.settled && (
                          <button
                            onClick={() => complete(escrow.id)}
                            disabled={loading}
                            style={{...styles.smallButton, backgroundColor: '#10b981'}}
                          >
                            Complete & Release Funds
                          </button>
                        )}
                        
                        {/* Refund button for payer if deadline passed */}
                        {isPayer && deadlinePassed && !bothApproved && !escrow.settled && (
                          <button
                            onClick={() => refund(escrow.id)}
                            disabled={loading}
                            style={{...styles.smallButton, backgroundColor: '#f44336'}}
                          >
                            Refund (Deadline Passed)
                          </button>
                        )}
                      </div>
                    )}
                    
                    {escrow.settled && (
                      <p style={{color: '#10b981', fontWeight: 'bold'}}>
                        ✓ Escrow completed
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          {/* REMOVED: Yield tab, deposit buttons, claim buttons, charts */}
        </>
      )}
    </div>
  );
}

// Styles - almost identical to before
const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  button: {
    backgroundColor: '#4f46e5',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    width: '100%'
  },
  smallButton: {
    color: 'white',
    padding: '5px 15px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    margin: '5px',
    fontSize: '14px'
  },
  input: {
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '14px'
  },
  card: {
    backgroundColor: '#f9fafb',
    padding: '20px',
    borderRadius: '10px',
    margin: '20px 0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  escrowItem: {
    border: '1px solid #e5e7eb',
    padding: '15px',
    borderRadius: '5px',
    margin: '10px 0',
    backgroundColor: 'white'
  }
};

export default App;
