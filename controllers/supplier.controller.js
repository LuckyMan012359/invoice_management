const Supplier = require('../models/supplier.model');
const Trasnaction = require('../models/transaction.model');
const User = require('../models/user.model');

exports.createSupplier = async (req, res) => {
  const { name, email, phoneNumber, homeAddress } = req.body;

  try {
    const existingSupplier = await Supplier.findOne({ email }).exec();
    if (existingSupplier) {
      return res
        .status(409)
        .send({ message: "Supplier already exists. Please update supplier's info" });
    }

    const supplierData = new Supplier({
      name,
      email,
      homeAddress: homeAddress,
      phoneNumber: phoneNumber,
    });

    await supplierData.save();
    return res.status(201).send({ message: 'Supplier created successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'An error occurred while creating the supplier.' });
  }
};

exports.readSupplier = async (req, res) => {
  const { pageNum, pageSize, keyword } = req.query;

  console.log(req.query);

  try {
    const filter = keyword
      ? {
          $or: [
            { name: { $regex: keyword, $options: 'i' } },
            { email: { $regex: keyword, $options: 'i' } },
            { phoneNumber: { $regex: keyword, $options: 'i' } },
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
        const transactions = await Trasnaction.find({ supplier_id: supplier._id });

        if (transactions && transactions.length > 0) {
          const { invoiceTotal, paymentTotal } = transactions.reduce(
            (totals, item) => {
              if (item.transaction_type === 'invoice') {
                totals.invoiceTotal += item.amount || 0;
              } else {
                totals.paymentTotal += item.amount || 0;
              }
              return totals;
            },
            { invoiceTotal: 0, paymentTotal: 0 },
          );

          supplier = supplier.toObject();
          supplier.totalPurchase = invoiceTotal;
          supplier.totalPayment = paymentTotal;
          supplier.totalBalance = invoiceTotal - paymentTotal;
        } else {
          supplier = supplier.toObject();
          supplier.totalPurchase = 0;
          supplier.totalPayment = 0;
          supplier.totalBalance = 0;
          supplier.totalBalance = 0;
        }

        return supplier;
      }),
    );

    return res.status(200).send({
      data: resultSuppliers,
      meta: {
        totalRecords: totalCount,
        currentPage: parseInt(pageNum),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'An error occurred while fetching customers.' });
  }
};

exports.updateSupplier = async (req, res) => {
  const { _id, name, email, phoneNumber, homeAddress } = req.body;

  console.log(req.body);

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

    return res.status(200).send({ message: 'Customer updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'An error occurred while updating the customer.' });
  }
};

exports.deleteSupplier = async (req, res) => {
  console.log(req.query);
  const { deleteSupplierID } = req.query;

  try {
    if (!deleteSupplierID) {
      return res.status(400).send({ message: 'Customer ID is required.' });
    }

    const deletedCustomer = await Supplier.findByIdAndDelete(deleteSupplierID).exec();
    if (!deletedCustomer) {
      return res.status(404).send({ message: 'Customer not found.' });
    }

    return res
      .status(200)
      .send({ message: 'Customer deleted successfully.', customer: deletedCustomer });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return res.status(500).send({ message: 'An error occurred while deleting the customer.' });
  }
};
