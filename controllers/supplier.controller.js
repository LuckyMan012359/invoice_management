const { deleteCache, getCache, setCache } = require('../config/cacheController');
const Supplier = require('../models/supplier.model');
const Transaction = require('../models/transaction.model');

exports.createSupplier = async (req, res) => {
  const { name, email, phoneNumber, homeAddress } = req.body;

  try {
    const existingSupplier = await Supplier.findOne({ email }).exec();
    if (existingSupplier) {
      return res
        .status(409)
        .send({ message: "Supplier already exist. Please update supplier's info" });
    }

    const supplierData = new Supplier({
      name,
      email,
      homeAddress: homeAddress,
      phoneNumber: phoneNumber,
    });

    await supplierData.save();

    deleteCache('transaction');
    deleteCache('pending_transaction');
    deleteCache('supplier');

    return res.status(201).send({ message: 'Supplier created successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'An error occurred while creating the supplier.' });
  }
};

exports.readSupplier = async (req, res) => {
  const { pageNum, pageSize, keyword } = req.query;

  try {
    const cacheKey = `suppliers:${req.user.email}:${req.user.role}:${pageNum}:${pageSize}:${keyword}`;

    const cachedData = getCache('supplier', cacheKey);

    if (cachedData) {
      return res.status(200).send(cachedData);
    }

    const filter = keyword
      ? {
          $or: [
            { name: { $regex: keyword, $options: 'i' } },
            { email: { $regex: keyword, $options: 'i' } },
            { phoneNumber: { $regex: keyword, $options: 'i' } },
            { homeAddress: { $regex: keyword, $options: 'i' } },
          ],
        }
      : {};

    const limit = parseInt(pageSize);
    const skip = (parseInt(pageNum) - 1) * limit;

    const suppliers = await Supplier.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const totalCount = await Supplier.find(filter).countDocuments(filter);

    const resultSuppliers = await Promise.all(
      suppliers.map(async (supplier) => {
        const transactions = await Transaction.find({ supplier_id: supplier._id });

        if (transactions && transactions.length > 0) {
          const { invoiceTotal, paymentTotal, returnTotal } = transactions.reduce(
            (totals, item) => {
              if (item.transaction_type === 'invoice') {
                totals.invoiceTotal += item.amount || 0;
              } else if (item.transaction_type === 'payment') {
                totals.paymentTotal += item.amount || 0;
              } else {
                totals.returnTotal += item.amount || 0;
              }
              return totals;
            },
            { invoiceTotal: 0, paymentTotal: 0, returnTotal: 0 },
          );

          supplier = supplier.toObject();
          supplier.totalPurchase = invoiceTotal;
          supplier.totalPayment = paymentTotal;
          supplier.totalReturn = returnTotal;
          supplier.totalBalance = invoiceTotal - paymentTotal - returnTotal;
        } else {
          supplier = supplier.toObject();
          supplier.totalPurchase = 0;
          supplier.totalPayment = 0;
          supplier.totalReturn = 0;
          supplier.totalBalance = 0;
        }

        return supplier;
      }),
    );

    const totalPipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplier_id',
          foreignField: '_id',
          as: 'supplier',
        },
      },
      {
        $unwind: { path: '$customer', preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true },
      },
      {
        $sort: { created: -1 },
      },
      {
        $project: {
          _id: 1,
          transaction_type: 1,
          amount: 1,
          balance: 1,
          notes: 1,
          transaction_date: 1,
          'customer._id': 1,
          'customer.email': 1,
          'customer.firstName': 1,
          'customer.lastName': 1,
          'supplier._id': 1,
          'supplier.email': 1,
          'supplier.name': 1,
        },
      },
    ];

    const totalTransactions = await Transaction.aggregate(totalPipeline);

    let incomes = 0;
    let expenses = 0;

    totalTransactions.forEach((item) => {
      if (item.transaction_type === 'invoice') {
        incomes += item.amount;
      } else {
        expenses += item.amount;
      }
    });

    const result = {
      data: resultSuppliers,
      incomes,
      expenses,
      meta: {
        totalRecords: totalCount,
        currentPage: parseInt(pageNum),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    setCache('supplier', cacheKey, result);

    return res.status(200).send(result);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'An error occurred while fetching customers.' });
  }
};

exports.updateSupplier = async (req, res) => {
  const { _id, name, email, phoneNumber, homeAddress } = req.body;

  try {
    const existingCustomer = await Supplier.findOne({ _id }).exec();
    if (!existingCustomer) {
      return res.status(404).send({ message: 'Customer not found.' });
    }

    const updateFields = {
      name,
      email,
      homeAddress,
      phoneNumber,
    };

    await Supplier.updateOne({ _id }, { $set: updateFields });

    deleteCache('transaction');
    deleteCache('pending_transaction');
    deleteCache('supplier');

    return res.status(200).send({ message: 'Supplier updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'An error occurred while updating the customer.' });
  }
};

exports.deleteSupplier = async (req, res) => {
  const { deleteSupplierID } = req.query;

  try {
    if (!deleteSupplierID) {
      return res.status(400).send({ message: 'Customer ID is required.' });
    }

    const deletedCustomer = await Supplier.findByIdAndDelete(deleteSupplierID).exec();
    if (!deletedCustomer) {
      return res.status(404).send({ message: 'Customer not found.' });
    }

    deleteCache('transaction');
    deleteCache('pending_transaction');
    deleteCache('supplier');

    return res
      .status(200)
      .send({ message: 'Supplier deleted successfully.', customer: deletedCustomer });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return res.status(500).send({ message: 'An error occurred while deleting the customer.' });
  }
};
