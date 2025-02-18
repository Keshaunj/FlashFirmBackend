# **Flash Firm Decentralized Finance (DeFi)- FRONTEND**

This is the **backend** for **Flash Firm DEX**, a **non-custodial Solana wallet** that enables users to securely send and receive SOL and SPL tokens. Built with **Express.js**, **MongoDB**, and **JWT authentication**, this backend provides **full CRUD operations** for user profiles, transactions, and wallet interactions.

---

## **Tech Stack**
- **Server Framework**: Express.js  
- **Database**: MongoDB (Mongoose)  
- **Authentication**: JWT (JSON Web Token)  
- **CORS**: Enabled for frontend communication  
- **Blockchain Integration**: Solana Web3.js & Solana RPC API  
- **API Calls**: Fetch  

---

## **Features**
✅ **User Authentication** (Signup, Login, Logout, JWT)  
✅ **Non-Custodial Wallet Management**  
✅ **Send & Receive SOL / SPL Tokens**  
✅ **Check Wallet Balance**  
✅ **Transaction History & Logging**  
✅ **User Profile CRUD Operations**  
✅ **Secure API Endpoints** with JWT  

---

## **Installation & Setup**

### **1. Clone the Repository**
```bash
git clone https://github.com/Keshaunj/solana-dapp/tree/main/Backend
cd solana_dapp/backend
```

### **2. Install Dependencies**
```bash
npm install
```


API Endpoints

Authentication
Method	Endpoint	Description
POST	/signup	Register a new user
POST	/login	Authenticate user & return JWT
POST	/logout	Logout user
Wallet & Transactions
Method	Endpoint	Description
POST	/send	Send SOL/SPL tokens
GET	/balance/:address	Get wallet balance
GET	/transactions/:address	Fetch user transactions
GET	/transactions	Get all transaction history
DELETE	/transaction/:id	Delete a transaction
User Profile
Method	Endpoint	Description
GET	/profile	Get user profile
PATCH	/profile	Update user profile
DELETE	/profile	Delete user profile

2. Install Dependencies
bash
Copy
Edit
npm install
3. Environment Variables (.env)
Create a .env file in the root and add:

env
Copy
Edit
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

fetch("http://localhost:5000/signup", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    username: "testuser",
    email: "test@example.com",
    password: "securepassword"
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error("Error:", error));

4. Start the Server
bash

nodemon server.js

Deployment
1. Deploy MongoDB (Atlas or Self-hosted)
Create a MongoDB Atlas cluster or use a local database
Update MONGO_URI in .env
2. Deploy on Vercel, Render, or Heroku
Use a free service like Render or Vercel
Add environment variables to the deployment settings
3. Update Frontend API URL
In .env for frontend:
env
Copy
Edit
VITE_BACKEND_URL=http://localhost:3000 ex.
Contributing
Fork the repo
Create a new branch
Make your changes & commit
Submit a pull request
License
This project is open-source under the MIT License.

🚀 Flash Firm DEX – Secure, Decentralized, and Non-Custodial! 🔥


https://github.com/Keshaunj/solana-dapp/blob/main/readme.md




