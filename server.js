import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import morgan from "morgan";
import { Connection, PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js'; 
import authRoutes from "./routes/authRoutes.js";
import cookieParser from 'cookie-parser';


dotenv.config();

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env");
  process.exit(1);
}


const app = express();


app.use(cors({
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST', 'OPTIONS','PATCH','DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, 
}));
app.options('*', cors()); 
app.use(express.json());
app.use(helmet()); 
app.use(morgan("dev")); 
app.use(cookieParser());


const mongoURI = process.env.MONGODB_URI;

mongoose
  .connect(mongoURI)
  .then(() => {
  
  })
  .catch((err) => {
    
    process.exit(1);
  });


const getBalance = async (publicKey) => {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const pubKeyObj = new PublicKey(publicKey);

  
  const balanceInLamports = await connection.getBalance(pubKeyObj);
  return balanceInLamports / 1e9;
};


const sendSolTransaction = async (senderAddress, senderPrivateKey, recipientAddress, amount) => {
  try {
   
    const senderKeypair = Keypair.fromSecretKey(Uint8Array.from(senderPrivateKey));
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    
 
    const recipientPublicKey = new PublicKey(recipientAddress);
    

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: recipientPublicKey,
        lamports: amount * 1e9, 
      })
    );
    
   
    const signature = await connection.sendTransaction(transaction, [senderKeypair]);
    await connection.confirmTransaction(signature, 'confirmed');
    
    return signature;
  } catch (error) {
    throw new Error('Transaction failed: ' + error.message);
  }
};


app.use("/auth", authRoutes);


app.get('/api/check-balance/:publicKey', async (req, res) => {
  const publicKey = req.params.publicKey;
  
  try {
    const balance = await getBalance(publicKey);
    res.json({ balance });
  } catch (error) {
   
    res.status(500).send('Internal Server Error');
  }
});


app.use((err, req, res, next) => {

  res.status(500).json({ message: "Something went wrong!" });
});


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
    res.status(200).json({ success: true, result: transactionResult });
  } catch (err) {
  
    res.status(500).json({ error: 'Transaction failed' });
  }
});




const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
 
});
