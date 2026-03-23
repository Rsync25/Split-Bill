import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import SimpleEscrowABI from './abis/SimpleEscrow.json';

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [deadlineDays, setDeadlineDays] = useState('7');

  const CONTRACT_ADDRESS = '0x24a9f4ba13a490f7165725d311bb668814edb8d1';

  // State names mapping
  const stateNames = ['Awaiting Payment', 'Awaiting Approval', 'Completed', 'Expired'];

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }
    
    try {
      setLoading(true);
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      
      // Check network - switch to RSK Testnet if needed
      const network = await provider.getNetwork();
      if (network.chainId !== 31) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1f' }], // 31 in hex
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x1f',
                chainName: 'RSK Testnet',
                nativeCurrency: { name: 'tRBTC', symbol: 'tRBTC', decimals: 18 },
                rpcUrls: ['https://public-node.testnet.rsk.co'],
                blockExplorerUrls: ['https://explorer.testnet.rootstock.io/']
              }]
            });
          }
        }
      }
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, SimpleEscrowABI.abi, signer);
      
      setAccount(address);
      setContract(contract);
      setProvider(provider);
      
      // Load escrows
      loadEscrows(contract, address);
      
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect wallet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load all escrows where user is involved
  const loadEscrows = async (contract, address) => {
    try {
      setLoading(true);
      const count = await contract.escrowCount();
      const escrowList = [];
      
      for (let i = 1; i <= count; i++) {
        const escrow = await contract.getEscrow(i);
        
        // Only show escrows where user is payer or payee
        if (escrow.payer === address || escrow.payee === address) {
          escrowList.push({
            id: i,
            title: escrow.title,
            amount: ethers.utils.formatEther(escrow.amount),
            payer: escrow.payer,
            payee: escrow.payee,
            deadline: new Date(escrow.deadline * 1000).toLocaleString(),
            deadlineTimestamp: escrow.deadline.toNumber(),
            state: escrow.state,
            stateName: stateNames[escrow.state],
            payerApproved: escrow.payerApproved,
            payeeApproved: escrow.payeeApproved
          });
        }
      }
      
      setEscrows(escrowList);
    } catch (error) {
      console.error('Load escrows error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create escrow
  const createEscrow = async (e) => {
    e.preventDefault();
    if (!contract) return;
    
    setLoading(true);
    try {
      const amountWei = ethers.utils.parseEther(amount);
      const deadlineDaysNum = parseInt(deadlineDays);
      
      const tx = await contract.createEscrow(
        title,
        payee,
        deadlineDaysNum,
        { value: amountWei }
      );
      
      await tx.wait();
      
      alert('✅ Escrow created successfully!');
      setTitle('');
      setPayee('');
      setAmount('');
      setDeadlineDays('7');
      
      await loadEscrows(contract, account);
      
    } catch (error) {
      console.error('Create escrow error:', error);
      alert('Error: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Release funds
  const releaseFunds = async (id) => {
    if (!contract) return;
    
    setLoading(true);
    try {
      const tx = await contract.release(id);
      await tx.wait();
      alert('✅ Funds released! Waiting for approvals.');
      await loadEscrows(contract, account);
    } catch (error) {
      console.error('Release error:', error);
      alert('Error: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Approve
  const approveEscrow = async (id) => {
    if (!contract) return;
    
    setLoading(true);
    try {
      const tx = await contract.approve(id);
      await tx.wait();
      alert('✅ Approved!');
      await loadEscrows(contract, account);
    } catch (error) {
      console.error('Approve error:', error);
      alert('Error: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Refund
  const refundEscrow = async (id) => {
    if (!contract) return;
    
    setLoading(true);
    try {
      const tx = await contract.refund(id);
      await tx.wait();
      alert('✅ Refunded! Funds returned to payer.');
      await loadEscrows(contract, account);
    } catch (error) {
      console.error('Refund error:', error);
      alert('Error: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Check if deadline passed
  const isDeadlinePassed = (deadlineTimestamp) => {
    return Date.now() / 1000 > deadlineTimestamp;
  };

  return (
    <div style={styles.container}>
      <h1>🔒 Simple Escrow</h1>
      <p>Time-based escrow with multi-party approval</p>
      
      {!account ? (
        <button onClick={connectWallet} style={styles.button} disabled={loading}>
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <>
          <div style={styles.header}>
            <p>✅ Connected: {account.slice(0,6)}...{account.slice(-4)}</p>
            <button onClick={() => loadEscrows(contract, account)} style={styles.smallButton}>
              Refresh
            </button>
          </div>
          
          {/* Create Escrow Form */}
          <div style={styles.card}>
            <h3>📝 Create Escrow</h3>
            <form onSubmit={createEscrow}>
              <input
                style={styles.input}
                type="text"
                placeholder="Title (e.g., Freelance Payment)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <input
                style={styles.input}
                type="text"
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
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(e.target.value)}
                required
              />
              <button type="submit" style={styles.button} disabled={loading}>
                {loading ? 'Creating...' : 'Create Escrow'}
              </button>
            </form>
          </div>
          
          {/* Escrows List */}
          <div style={styles.card}>
            <h3>📋 Your Escrows</h3>
            {escrows.length === 0 ? (
              <p>No escrows yet. Create one above!</p>
            ) : (
              escrows.map(escrow => {
                const isPayer = escrow.payer === account;
                const isPayee = escrow.payee === account;
                const bothApproved = escrow.payerApproved && escrow.payeeApproved;
                const deadlinePassed = isDeadlinePassed(escrow.deadlineTimestamp);
                const canRefund = isPayer && deadlinePassed && escrow.state === 1; // AWAITING_APPROVAL
                const canRelease = isPayer && escrow.state === 0; // AWAITING_PAYMENT
                const canApprove = escrow.state === 1 && 
                  ((isPayer && !escrow.payerApproved) || (isPayee && !escrow.payeeApproved));
                
                return (
                  <div key={escrow.id} style={styles.escrowItem}>
                    <h4>{escrow.title} (#{escrow.id})</h4>
                    <p><strong>Amount:</strong> {escrow.amount} RBTC</p>
                    <p><strong>Payer:</strong> {escrow.payer === account ? 'You' : escrow.payer.slice(0,6)}</p>
                    <p><strong>Payee:</strong> {escrow.payee === account ? 'You' : escrow.payee.slice(0,6)}</p>
                    <p><strong>Deadline:</strong> {escrow.deadline}</p>
                    <p><strong>Status:</strong> <span style={{
                      color: escrow.state === 2 ? 'green' : escrow.state === 3 ? 'red' : 'orange',
                      fontWeight: 'bold'
                    }}>{escrow.stateName}</span></p>
                    
                    {escrow.state === 1 && (
                      <p><strong>Approvals:</strong> Payer: {escrow.payerApproved ? '✅' : '❌'} | Payee: {escrow.payeeApproved ? '✅' : '❌'}</p>
                    )}
                    
                    <div style={styles.buttonGroup}>
                      {canRelease && (
                        <button onClick={() => releaseFunds(escrow.id)} style={styles.actionButton}>
                          Release Funds
                        </button>
                      )}
                      
                      {canApprove && (
                        <button onClick={() => approveEscrow(escrow.id)} style={{...styles.actionButton, backgroundColor: '#10b981'}}>
                          Approve
                        </button>
                      )}
                      
                      {canRefund && (
                        <button onClick={() => refundEscrow(escrow.id)} style={{...styles.actionButton, backgroundColor: '#f44336'}}>
                          Refund (Deadline Passed)
                        </button>
                      )}
                    </div>
                    
                    {escrow.state === 2 && (
                      <p style={{color: 'green', fontWeight: 'bold'}}>✓ Escrow completed - funds sent to payee</p>
                    )}
                    
                    {escrow.state === 3 && (
                      <p style={{color: 'red', fontWeight: 'bold'}}>⏰ Escrow expired - funds refunded to payer</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f3f4f6',
    padding: '15px',
    borderRadius: '10px',
    marginBottom: '20px'
  },
  card: {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  input: {
    width: '100%',
    padding: '12px',
    margin: '8px 0',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '12px',
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px'
  },
  smallButton: {
    padding: '8px 16px',
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  actionButton: {
    padding: '8px 16px',
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginRight: '10px'
  },
  buttonGroup: {
    marginTop: '10px',
    display: 'flex',
    gap: '10px'
  },
  escrowItem: {
    border: '1px solid #e5e7eb',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
    backgroundColor: '#fafafa'
  }
};

export default App;