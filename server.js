import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import morgan from "morgan";
import { Connection, PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js'; 
import authRoutes from "./routes/authRoutes.js";
import cookieParser from 'cookie-parser';

// Load environment variables
dotenv.config();

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env");
  process.exit(1);
}

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.ALLOWED_ORIGIN : 'http://localhost:5173', 
  methods: ['GET', 'POST', 'OPTIONS','PATCH','DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, 
}));
app.options('*', cors()); 
app.use(express.json());
app.use(helmet()); 
app.use(morgan("dev")); 
app.use(cookieParser());

// Database connection
const mongoURI = process.env.MONGODB_URI;

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("Connected to MongoDB successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Solana helper functions
const getBalance = async (publicKey) => {
  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
    const pubKeyObj = new PublicKey(publicKey);
    
    const balanceInLamports = await connection.getBalance(pubKeyObj);
    return balanceInLamports / 1e9; // Convert lamports to SOL
  } catch (error) {
    console.error("Error fetching balance:", error);
    throw error;
  }
};

// Note: In a production app, you should never handle private keys directly in your backend
// This function should be refactored to use a more secure approach
const sendSolTransaction = async (senderAddress, senderPrivateKey, recipientAddress, amount) => {
  try {
    // Warning: Handling private keys directly is a security risk
    const senderKeypair = Keypair.fromSecretKey(Uint8Array.from(senderPrivateKey));
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com', 
      'confirmed'
    );
    
    const recipientPublicKey = new PublicKey(recipientAddress);
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: recipientPublicKey,
        lamports: amount * 1e9, // Convert SOL to lamports
      })
    );
    
    // Get recent blockhash for transaction
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = senderKeypair.publicKey;
    
    const signature = await connection.sendTransaction(transaction, [senderKeypair]);
    await connection.confirmTransaction(signature, 'confirmed');
    
    return signature;
  } catch (error) {
    console.error("Transaction error:", error);
    throw new Error('Transaction failed: ' + error.message);
  }
};

// Routes
app.use("/auth", authRoutes);

app.get('/api/check-balance/:publicKey', async (req, res) => {
  const publicKey = req.params.publicKey;
  
  try {
    const balance = await getBalance(publicKey);
    res.json({ balance });
  } catch (error) {
    console.error("Balance check error:", error);
    res.status(500).json({ error: 'Failed to retrieve balance' });
  }
});

// Transaction endpoint - SECURITY CONCERN: Should be refactored in production
app.post('/auth/send', async (req, res) => {
  const { senderAddress, senderPrivateKey, recipientAddress, amount } = req.body;

  if (!senderAddress || !senderPrivateKey || !recipientAddress || !amount) {
    return res.status(400).json({
      error: 'Missing required fields',
      details: 'Need senderAddress, senderPrivateKey, recipientAddress, and amount',
    });
  }

  try {
    const transactionResult = await sendSolTransaction(senderAddress, senderPrivateKey, recipientAddress, amount);
    res.status(200).json({ success: true, signature: transactionResult });
  } catch (err) {
    console.error("Transaction sending error:", err);
    res.status(500).json({ error: 'Transaction failed', message: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('🚀 Solana Wallet Backend is Live!');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Something went wrong!", error: err.message });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});