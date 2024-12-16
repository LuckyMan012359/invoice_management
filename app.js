// File: app.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const userRoute = require('./routes/user.route');
const transactionRouter = require('./routes/transaction.route');
const customerRouter = require('./routes/customer.route');
const supplierRouter = require('./routes/supplier.route');
const pendingTransactionRouter = require('./routes/pending_transaction.route');
const createInitialUserData = require('./middlewares/createInitialData');
const { connectDB } = require('./config/connect');
const app = express();
const server = http.createServer(app);

const getTransactionDataAmount = require('./getData');

const io = new Server(server, {
  cors: {
    origin: ['https://negociacionalex.lat', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

connectDB();

app.set('trust proxy', true);
app.set('io', io);

app.use(
  cors({
    origin: ['https://negociacionalex.lat', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

createInitialUserData();

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  console.log(`\x1b[42m ${req.method} ${req.url} request received.\x1b[0m`);
  next();
});

app.use('/api/user', userRoute);
app.use('/api/transaction', transactionRouter());
app.use('/api/customer', customerRouter);
app.use('/api/supplier', supplierRouter);
app.use('/api/pending', pendingTransactionRouter);

// Real-time Socket.IO logic
io.on('connection', (socket) => {
  socket.emit('message', 'Welcome to the Transactions App'); // Welcome message

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

app.get('*', (req, res) => {
  res.status(404).send('404! This is an invalid URL.');
});

getTransactionDataAmount(io);

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is live on port ${PORT}`);
});
