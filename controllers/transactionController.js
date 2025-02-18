const handleTransaction = async (req, res) => {
  try {
    const { senderAddress, recipientAddress, amount, signature } = req.body;

   
    const senderWallet = await Wallet.findOne({ publicKey: senderAddress });
    if (!senderWallet) {
      return res.status(404).json({ error: 'Sender wallet not found' });
    }

   
    const recipientWallet = await Wallet.findOne({ publicKey: recipientAddress });
    if (!recipientWallet) {
      return res.status(404).json({ error: 'Recipient wallet not found' });
    }

 
    const transactionTime = new Date();

   
    senderWallet.transactions.push({
      type: 'send',
      amount: amount,
      signature: signature,
      counterpartyAddress: recipientAddress,
      status: 'completed',
      timestamp: transactionTime
    });

  
    senderWallet.balance -= amount;

  
    recipientWallet.transactions.push({
      type: 'receive',
      amount: amount,
      signature: signature,
      counterpartyAddress: senderAddress,
      status: 'completed',
      timestamp: transactionTime
    });

   
    recipientWallet.balance += amount;

  
    await Promise.all([
      senderWallet.save(),
      recipientWallet.save()
    ]);

    return res.status(200).json({
      message: 'Transaction completed successfully',
      transaction: {
        signature,
        amount,
        senderAddress,
        recipientAddress,
        timestamp: transactionTime
      }
    });

  } catch (error) {
    console.error('Transaction error:', error);
    return res.status(500).json({ error: 'Failed to process transaction' });
  }
};


const getWalletTransactions = async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const wallet = await Wallet.findOne({ publicKey: walletAddress });
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    
    const transactions = wallet.transactions.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );

    return res.status(200).json({ transactions });

  } catch (error) {
    
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export { handleTransaction, getWalletTransactions }; 