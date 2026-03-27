import React, { useState } from 'react';
import { ethers } from 'ethers';
import SimpleEscrowABI from './abis/SimpleEscrow.json';

const CONTRACT_ADDRESS = '0x24a9f4ba13a490f7165725d311bb668814edb8d1';

function App() {
  const [account, setAccount] = useState('');
  const [setContract] = useState(null);
  const [error, setError] = useState('');

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError('Please install MetaMask');
        return;
      }

      // Request accounts
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      // Check contract
      const contract = new ethers.Contract(CONTRACT_ADDRESS, SimpleEscrowABI.abi, signer);
      
      // Test connection
      const count = await contract.escrowCount();
      console.log('Connected! Escrow count:', count.toString());

      setAccount(address);
      setContract(contract);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Simple Escrow</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <p>Connected: {account}</p>
      )}
    </div>
  );
}

export default App;