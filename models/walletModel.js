import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  senderAddress: { type: String, required: true },
  recipientAddress: { type: String, required: true },
  amount: { type: Number, required: true },
  signature: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });


walletSchema.index({ 'transactions.signature': 1 });
walletSchema.index({ 'transactions.date': -1 });

const Wallet = mongoose.model('Wallet', walletSchema);

export default Wallet;


