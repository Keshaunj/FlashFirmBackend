import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { validationResult } from "express-validator";
import { Keypair, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import Wallet from '../models/walletModel.js';



const authenticateToken = (req, res, next) => {
  try {
    const token = req.cookies?.jwt || req.header("Authorization")?.replace("Bearer ", "");
    

    if (!token) {
    
      return res.status(403).json({ error: "Access denied. No token provided." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        
        return res.status(403).json({ error: "Invalid token." });
      }

    
      req.user = user;
      next();
    });
  } catch (error) {
   
    return res.status(403).json({ error: "Authentication failed" });
  }
};


const signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
   
    res.status(500).json({ message: "Error creating user" });
  }
};




const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
   
    if (!username || !password) {
      return res.status(400).json({
        error: "Missing credentials",
        details: "Username and password are required"
      });
    }

   
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        error: "Authentication failed",
        details: "User not found"
      });
    }

   
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        error: "Authentication failed",
        details: "Invalid password"
      });
    }

   
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

   
    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username
      }
    });

  } catch (error) {
    
    return res.status(500).json({
      error: "Login failed",
      details: error.message
    });
  }
};

const logout = (req, res) => {
  res.json({ message: "Logged out successfully" });
};

const checkBalance = async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: "Wallet address is required" });
    }

  
    const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
    
    try {
   
      const balance = await connection.getBalance(new PublicKey(address));
      
  
      const solBalance = balance / LAMPORTS_PER_SOL;
      
      return res.json({
        success: true,
        balance: solBalance,
        lamports: balance,
        address: address
      });

    } catch (error) {
    
      return res.status(400).json({ 
        error: "Failed to get balance",
        details: error.message 
      });
    }

  } catch (error) {
  
    res.status(500).json({ 
      error: "Failed to check balance",
      details: error.message 
    });
  }
};


const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || 'demo';
const RPC_ENDPOINT = `https://solana-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
const sendTransaction = async (req, res) => {
  try {
    const { senderAddress, senderPrivateKey, recipientAddress, amount } = req.body;

  
    const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

    try {
     
      const fromPubKey = new PublicKey(senderAddress);
      const toPubKey = new PublicKey(recipientAddress);

      
      const privateKeyBytes = new Uint8Array(
        senderPrivateKey.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
      );
      const fromKeypair = Keypair.fromSecretKey(privateKeyBytes);

     
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromPubKey,
          toPubkey: toPubKey,
          lamports: amount * LAMPORTS_PER_SOL
        })
      );

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubKey;
      transaction.sign(fromKeypair);

      const signature = await connection.sendRawTransaction(
        transaction.serialize(),
        {
          maxRetries: 5,
          skipPreflight: true
        }
      );

  

     
      const newTransaction = await Wallet.create({
        senderAddress,
        recipientAddress,
        amount,
        signature
      });

      

      return res.json({
        message: "Transaction completed successfully",
        signature: signature,
        amount: amount,
        recipientAddress: recipientAddress
      });

    } catch (error) {
    
      return res.status(400).json({
        error: "Transaction failed",
        details: error.message
      });
    }
  } catch (error) {
  
    return res.status(500).json({
      error: "Transaction failed",
      details: "Internal server error"
    });
  }
};


const getTransactionHistory = async (req, res) => {
  try {
    const transactions = await Wallet.find()
      .sort({ timestamp: -1 }); 
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
};

const getBalance = async (req, res) => {
  try {
    const { address } = req.params;
    
   
    const connection = new Connection(clusterApiUrl('mainnet-beta'));
    
    
    const balance = await connection.getBalance(new PublicKey(address));
    const solBalance = balance / LAMPORTS_PER_SOL;
    
    res.json({ balance: solBalance });
  } catch (error) {
    console.error('Error getting balance:', error);
    res.status(400).json({ 
      error: "Failed to get balance",
      details: error.message 
    });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { address } = req.params;
    const wallet = await Wallet.findOne({ publicKey: address });
    
    if (!wallet) {
      return res.json([]);  
    }

    
    const transactions = wallet.transactions.sort((a, b) => b.date - a.date);
    
    res.json(transactions);
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ 
      error: "Failed to get transactions",
      details: error.message 
    });
  }
};


 const updateProfile = async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.userId; 

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.username = username;
    await user.save();

    return res.status(200).json({ 
      message: 'Username updated successfully', 
      user: {
        username: user.username,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error updating username:', error);
    res.status(500).json({ error: 'Server error' });
  }
};





const deleteProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id); 
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
   
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserProfile = async (req, res) => {
  const userId = req.user.userId; 

  try {
   
    const user = await User.findById(userId).select('username createdAt'); 

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    
    res.status(200).json({
      username: user.username,
      createdAt: user.createdAt, 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};



const verifyToken = (req, res, next) => {
  
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
   
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

  
    req.user = decoded;

   
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired.' });
    }
    res.status(400).json({ error: 'Invalid token.' });
  }
};


const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedTransaction = await Wallet.findByIdAndDelete(id);
    
    if (!deletedTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
   
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};

export {
  authenticateToken,
  signup,
  login,
  logout,
  checkBalance,
  sendTransaction,
  getBalance,
  getTransactions,
  getUserProfile,
  updateProfile,
  deleteProfile,
  verifyToken,
  getTransactionHistory,
  deleteTransaction
};
