const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

dotenv.config();
connectDB();

const importData = async () => {
  try {
    await User.deleteMany();
    await Transaction.deleteMany();
    console.log('Old data cleared...');
    const users = [
      { username: 'Admin User', email: 'admin@test.com', password: 'password123', role: 'admin' },
      { username: 'Analyst User', email: 'analyst@test.com', password: 'password123', role: 'analyst' },
      { username: 'Viewer User', email: 'viewer@test.com', password: 'password123', role: 'viewer' },
    ];

    for (const user of users) {
        await User.create(user);
    }
    console.log('Users Imported! (Password: password123)');

    const transactions = [];
    for (let i = 1; i <= 1000; i++) {
        transactions.push({
            transactionID: `TXN-${1000 + i}`,
            referenceNumber: `REF-${1000 + i}`,
            amount: (Math.random() * 1000).toFixed(2),
            date: new Date(),
            description: `System Record #${i}`,
            source: 'system'
        });
    }

    await Transaction.insertMany(transactions);
    console.log('1000 System Transactions Imported!');

    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

importData();