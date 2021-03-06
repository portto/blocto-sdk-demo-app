
import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import BloctoSDK from '@blocto/sdk';
import {
  Transaction,
  PublicKey,
  SystemProgram,
  Keypair,
} from '@solana/web3.js';

const Solana = () => {

  const sdk = useRef(null);

  const [status, setStatus] = useState('NOT_ENABLED');
  const [account, setAccount] = useState(null);

  const [balance, setBalance] = useState(null);
  const [sendTo, setSendTo] = useState('');
  const [amount, setAmount] = useState('');
  const [newAccount, setNewAccount] = useState(null);
  const [newAccount2, setNewAccount2] = useState(null);
  const [transactionStatus, setTransactionStatus] = useState('IDLE');
  const [partialSignTxStatus, setPartialSignTxStatus] = useState('IDLE');
  const [partialSignTx2Status, setPartialSignTx2Status] = useState('IDLE');
  const [txHash, setTxHash] = useState(null);

  useEffect(() => {
    sdk.current = new BloctoSDK({ solana: { net: 'devnet' } });

    setStatus('ENABLING')
    // connect wallet
    sdk.current.solana.connect().then(() => {
      setStatus('FETCH_DATA')
    })
  }, [])

  useEffect(() => {
    if(!sdk.current) return;
    const { solana } = sdk.current

    const fetchData = async () => {
      setAccount(solana.accounts[0]);
      const balanceResponse = await solana.request({
        method: 'getBalance',
        params: [solana.accounts[0]]
      });

      setBalance(balanceResponse.value);
    }
    if(solana.accounts[0] && status === 'FETCH_DATA') {
      fetchData().then(() => setStatus('ENABLED'))
    };
  }, [status])

  const sendTransaction = useCallback(async (e) => {
    if(!sdk.current)return;
    const { solana } = sdk.current
    e.preventDefault();

    const { value: { blockhash } } = await solana.request({ method: 'getRecentBlockhash' });
    const transaction = new Transaction();
    const publicKey = new PublicKey(account);
    transaction.add(SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: new PublicKey(sendTo),
      lamports: amount,
    }));

    transaction.feePayer = publicKey;
    transaction.recentBlockhash = blockhash

    setTransactionStatus('PENDING');
    solana.signAndSendTransaction(transaction)
      .then(response => {
        setTxHash(response)
        setTransactionStatus('SUCCESS')
        solana.request({ method: 'getBalance', params: [account]})
          .then(({ value }) => setBalance(value))
      })
      .catch(() => setTransactionStatus('FAILED'));

  }, [account, sendTo, amount]);

  const sendPartialSignTransaction = useCallback(async (e) => {
    if(!sdk.current)return;
    const { solana } = sdk.current
    e.preventDefault();

    const { value: { blockhash } } = await solana.request({ method: 'getRecentBlockhash' });
    const transaction = new Transaction();
    const publicKey = new PublicKey(account);

    const newKeypair = new Keypair();
    const newAccountKey = newKeypair.publicKey;

    const rent = await solana.request({ method: 'getMinimumBalanceForRentExemption', params: [10] })

    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: publicKey,
      newAccountPubkey: newAccountKey,
      lamports: rent,
      // create an account with newly-generated key, and assign it to system program
      programId: SystemProgram.programId,
      space: 10,
    });
    transaction.add(createAccountInstruction);

    setNewAccount(newAccountKey.toBase58());

    const transferInstruction = SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: newAccountKey,
      lamports: 100,
    });

    transaction.add(transferInstruction);

    transaction.feePayer = publicKey;
    transaction.recentBlockhash = blockhash;

    try {
      const converted = await solana.convertToProgramWalletTransaction(transaction)
      converted.partialSign(newKeypair);

      setPartialSignTxStatus('PENDING');

      const response = await solana.signAndSendTransaction(converted)
      setTxHash(response);
      setPartialSignTxStatus('SUCCESS');
      solana.request({ method: 'getBalance', params: [account]})
        .then(({ value }) => setBalance(value));
    } catch (e) {
      console.error(e);
      setPartialSignTxStatus('FAILED')
    }
  }, [account]);

  const sendPartialSignTransaction2 = useCallback(async (e) => {
    if(!sdk.current)return;
    const { solana } = sdk.current
    e.preventDefault();

    const { value: { blockhash } } = await solana.request({ method: 'getRecentBlockhash' });
    const transaction = new Transaction();
    const publicKey = new PublicKey(account);

    const newKeypair = new Keypair();
    const newAccountKey = newKeypair.publicKey;

    const rent = await solana.request({ method: 'getMinimumBalanceForRentExemption', params: [10] })

    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: publicKey,
      newAccountPubkey: newAccountKey,
      lamports: rent,
      // create an account with newly-generated key, and assign it to system program
      programId: SystemProgram.programId,
      space: 10,
    });
    transaction.add(createAccountInstruction);

    setNewAccount2(newAccountKey.toBase58());

    transaction.feePayer = publicKey;
    transaction.recentBlockhash = blockhash;

    try {
      const converted = await solana.convertToProgramWalletTransaction(transaction)
      converted.partialSign(newKeypair);

      setPartialSignTx2Status('PENDING');

      const response = await solana.signAndSendTransaction(converted)
      setTxHash(response);
      setPartialSignTx2Status('SUCCESS');
      solana.request({ method: 'getBalance', params: [account]})
        .then(({ value }) => setBalance(value));
    } catch (e) {
      console.error(e);
      setPartialSignTx2Status('FAILED')
    }
  }, [account]);

  return (
    <div className="page-wrapper">
      { status === 'FETCH_DATA' && (
        <div className="spinner-border m-auto big-spinner" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      )}
      { status === 'ENABLED' && (
        <div className="card m-auto">
          <div className="card-body">
            <Link className="d-inline-block plain-link mb-2 text-dark" to="/">
              <i className="fas fa-chevron-left me-2" />
            </Link>
            <h5 className="card-title">Account Info</h5>
            <div className="d-flex justify-content-between">
              <div className="me-4">Account</div>
              <div>{account}</div>
            </div>
            <div className="d-flex justify-content-between">
              <div className="me-4">Balance</div>
              <div>{balance} Lamports</div>
            </div>
          </div>

          <hr />

          <div className="card-body">
            <h5 className="card-title">Send Transaction</h5>
            <form onSubmit={sendTransaction}>
              <div className="mb-3">
                <label className="form-label">Receiver address</label>
                <input className="form-control" value={sendTo} onChange={e => setSendTo(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label">Amount(Lamports)</label>
                <input className="form-control" value={amount} onChange={e => setAmount(e.target.value)}  />
              </div>
              { transactionStatus === 'SUCCESS' && (
                <div className="alert alert-success">
                  Transaction Succeed! <br />
                  Check your transaction {' '} 
                  <a 
                    href={`https://explorer.solana.com/tx/${txHash}?cluster=testnet`} 
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    here
                  </a>
                </div>
              )}
              { transactionStatus === 'FAILED' && (
                <div className="alert alert-danger">
                  Something went wrong :'(
                </div>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={transactionStatus === 'PENDING'}
              >
                {transactionStatus === 'PENDING' 
                  ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"/>
                      <span>Sending</span>
                    </>
                  ) 
                  : 'Send'
                }
              </button>
            </form>
          </div>

          <hr />

          <div className="card-body">
            <h5 className="card-title">Create account &amp; transfer</h5>
            <p>
              <small>
                Create a new account and transfer 100 lamports to it. <br />
                This is a kind of transaction involving dApp side signing.
              </small>
            </p>
            
            <form onSubmit={sendPartialSignTransaction}>
              { !['IDlE', 'FAILED'].includes(partialSignTxStatus) && newAccount && (
                <div className="alert alert-info">
                  Created Account, PubKey: {newAccount}
                </div>
              )}
              { partialSignTxStatus === 'SUCCESS' && (
                <div className="alert alert-success">
                  Transaction Succeed!<br />
                  Check your transaction {' '} 
                  <a 
                    href={`https://explorer.solana.com/tx/${txHash}?cluster=testnet`} 
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    here
                  </a>
                </div>
              )}
              { partialSignTxStatus === 'FAILED' && (
                <div className="alert alert-danger">
                  Something went wrong :'(
                </div>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={partialSignTxStatus === 'PENDING'}
              >
                {partialSignTxStatus === 'PENDING' 
                  ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"/>
                      <span>Sending</span>
                    </>
                  ) 
                  : 'Send'
                }
              </button>
            </form>
          </div>

          <hr />

          <div className="card-body">
            <h5 className="card-title">Create account</h5>
            
            <form onSubmit={sendPartialSignTransaction2}>
              { !['IDlE', 'FAILED'].includes(partialSignTx2Status) && newAccount2 && (
                <div className="alert alert-info">
                  Created Account, PubKey: {newAccount2}
                </div>
              )}
              { partialSignTx2Status === 'SUCCESS' && (
                <div className="alert alert-success">
                  Transaction Succeed!<br />
                  Check your transaction {' '} 
                  <a 
                    href={`https://explorer.solana.com/tx/${txHash}?cluster=testnet`} 
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    here
                  </a>
                </div>
              )}
              { partialSignTx2Status === 'FAILED' && (
                <div className="alert alert-danger">
                  Something went wrong :'(
                </div>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={partialSignTx2Status === 'PENDING'}
              >
                {partialSignTx2Status === 'PENDING' 
                  ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"/>
                      <span>Sending</span>
                    </>
                  ) 
                  : 'Send'
                }
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  )
}

export default Solana;