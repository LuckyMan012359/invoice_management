const express = require('express');
const app = express();
const userRoute = require('./routes/user.route');
const transactionRouter = require('./routes/transaction.route');
const customerRouter = require('./routes/customer.route');
const supplierRouter = require('./routes/supplier.route');
const pendingTransactionRouter = require('./routes/pending_transaction.route');
const { connectDB } = require('./config/connect');
const path = require('path');
const cors = require('cors');
const createInitialUserData = require('./middlewares/createInitialData');
require('dotenv').config();
const PORT = process.env.PORT || 8080;

connectDB();

app.set('trust proxy', true);

app.use(
  cors({
    origin: ['https://negociacionalex.lat'], // Allow requests only from this domain
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed HTTP methods
    credentials: true, // Allow credentials like cookies, authorization headers
  }),
);
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  }),
);

createInitialUserData();

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  console.log(`\x1b[42m ${req.method} ${req.url} request received.\x1b[0m`);
  next();
});

app.use('/api/user', userRoute);
app.use('/api/transaction', transactionRouter);
app.use('/api/customer', customerRouter);
app.use('/api/supplier', supplierRouter);
app.use('/api/pending', pendingTransactionRouter);
app.get('*', (req, res) => {
  res.status(404).send('404! This is an invalid URL.');
});

app.listen(PORT, () => {
  console.log(`Server is live on port ${PORT}`);
});
