import React, { useState } from 'react';
import { ethers } from 'ethers';
import SimpleEscrowABI from './abis/SimpleEscrow.json';

const CONTRACT_ADDRESS = '0x24a9f4ba13a490f7165725d311bb668814edb8d1';

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [title, setTitle] = useState('');
  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [deadlineDays, setDeadlineDays] = useState('7');

  const stateNames = ['Awaiting Payment', 'Awaiting Approval', 'Completed', 'Expired'];

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!window.ethereum) {
        setError('Please install MetaMask');
        return;
      }

      // Request accounts
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      // Check network
      const network = await provider.getNetwork();
      if (network.chainId !== 31) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1f' }],
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

      // Create contract instance
      const newContract = new ethers.Contract(CONTRACT_ADDRESS, SimpleEscrowABI.abi, signer);
      setContract(newContract);
      setAccount(address);
      
      // Load escrows
      await loadEscrows(newContract, address);
      
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadEscrows = async (contractInstance, address) => {
    try {
      const count = await contractInstance.escrowCount();
      const escrowList = [];
      
      for (let i = 1; i <= count; i++) {
        const escrow = await contractInstance.getEscrow(i);
        
        if (escrow.payer === address || escrow.payee === address) {
          // We use || to handle cases where the field might be named 'totalAmount' or 'amount'
          escrowList.push({
            id: i,
            title: escrow.title,
            amount: ethers.utils.formatEther(escrow.totalAmount || escrow.amount || "0"),
            payer: escrow.payer,
            payee: escrow.payee,
            deadline: new Date((escrow.deadline?.toNumber() || 0) * 1000).toLocaleString(),
            deadlineTimestamp: escrow.deadline?.toNumber() || 0,
            state: escrow.state,
            stateName: stateNames[escrow.state],
            payerApproved: escrow.payerApproved,
            payeeApproved: escrow.payeeApproved
          });
        }
      }
      
      setEscrows(escrowList);
    } catch (err) {
      console.error('Load escrows error:', err);
      setError(err.message);
    }
  };

  const createEscrow = async (e) => {
    e.preventDefault();
    if (!contract) return;
    
    setLoading(true);
    try {
      const amountWei = ethers.utils.parseEther(amount);
      const deadlineDaysNum = parseInt(deadlineDays);
      // Convert days into a Unix timestamp (seconds) as expected by the contract
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadlineDaysNum * 24 * 60 * 60);

      const tx = await contract.createEscrow(
        title,
        amountWei,
        deadlineTimestamp,
        payee
      );
      
      await tx.wait();
      alert('✅ Escrow created successfully!');
      
      setTitle('');
      setPayee('');
      setAmount('');
      setDeadlineDays('7');
      
      await loadEscrows(contract, account);
    } catch (err) {
      console.error(err);
      alert('Error: ' + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  const releaseFunds = async (id) => {
    if (!contract) return;
    setLoading(true);
    try {
      // Usually the contract function is named 'complete' or 'approve' if 'release' is missing
      const tx = await contract.complete(id);
      await tx.wait();
      alert('✅ Funds released!');
      await loadEscrows(contract, account);
    } catch (err) {
      alert('Error: ' + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  const approveEscrow = async (id) => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.approve(id);
      await tx.wait();
      alert('✅ Approved!');
      await loadEscrows(contract, account);
    } catch (err) {
      alert('Error: ' + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  const refundEscrow = async (id) => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.refund(id);
      await tx.wait();
      alert('✅ Refunded!');
      await loadEscrows(contract, account);
    } catch (err) {
      alert('Error: ' + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  const isDeadlinePassed = (timestamp) => {
    return Date.now() / 1000 > timestamp;
  };

  return (
    <div style={styles.container}>
      <h1>🔒 Simple Escrow</h1>
      
      {error && <p style={styles.error}>Error: {error}</p>}
      
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
                const canRelease = isPayer && escrow.state === 0;
                const canApprove = escrow.state === 1 && 
                  ((isPayer && !escrow.payerApproved) || (isPayee && !escrow.payeeApproved));
                const canRefund = isPayer && deadlinePassed && escrow.state === 1 && !bothApproved;
                
                return (
                  <div key={escrow.id} style={styles.escrowItem}>
                    <h4>{escrow.title} (#{escrow.id})</h4>
                    <p><strong>Amount:</strong> {escrow.amount} RBTC</p>
                    <p><strong>Payer:</strong> {escrow.payer === account ? 'You' : escrow.payer.slice(0,6)}</p>
                    <p><strong>Payee:</strong> {escrow.payee === account ? 'You' : escrow.payee.slice(0,6)}</p>
                    <p><strong>Deadline:</strong> {escrow.deadline}</p>
                    <p><strong>Status:</strong> <span style={{color: escrow.state === 2 ? 'green' : escrow.state === 3 ? 'red' : 'orange'}}>
                      {escrow.stateName}
                    </span></p>
                    
                    {escrow.state === 1 && (
                      <p>Approvals: Payer: {escrow.payerApproved ? '✅' : '❌'} | Payee: {escrow.payeeApproved ? '✅' : '❌'}</p>
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
                          Refund
                        </button>
                      )}
                    </div>
                    
                    {escrow.state === 2 && <p style={{color: 'green'}}>✓ Completed - funds sent to payee</p>}
                    {escrow.state === 3 && <p style={{color: 'red'}}>⏰ Expired - funds refunded</p>}
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
  container: { maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f3f4f6', padding: '15px', borderRadius: '10px', marginBottom: '20px' },
  card: { background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  input: { width: '100%', padding: '12px', margin: '8px 0', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  smallButton: { padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  actionButton: { padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' },
  buttonGroup: { marginTop: '10px', display: 'flex', gap: '10px' },
  escrowItem: { border: '1px solid #e5e7eb', padding: '15px', borderRadius: '8px', marginBottom: '15px', backgroundColor: '#fafafa' },
  error: { color: 'red', background: '#fee', padding: '10px', borderRadius: '5px', marginBottom: '20px' }
};

export default App;