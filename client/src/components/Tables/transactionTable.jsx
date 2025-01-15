import { useTranslation } from 'react-i18next';
import 'react-datepicker/dist/react-datepicker.css';
import { useEffect, useState } from 'react';
import Datepicker from 'react-tailwindcss-datepicker';
import TransactionForm from '../../components/Form/TransactionForm';
import axiosInstance from '../../utils/axiosInstance';
import * as XLSX from 'xlsx';
import { LoadingOutlined } from '@ant-design/icons';
import Select from 'react-select';

import { Modal } from 'antd';

import { FaRegEdit } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { toast } from 'react-toastify';
import getUserRole from '../../utils/getUserRole';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

const imageUrl = process.env.REACT_APP_IMAGE_URL;

export const TransactionTable = ({ isChanged, setIsChanged }) => {
  const { t, i18n } = useTranslation();
  const isDarkMode = useSelector((state) => state.darkMode.isDarkMode);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [type, setType] = useState('Add');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [date, setDate] = useState({
    startDate: '',
    endDate: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage, setTransactionsPerPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [customer, setCustomer] = useState('');
  const [supplier, setSupplier] = useState('');
  const [keyword, setKeyword] = useState('');
  const [transactionData, setTransactionData] = useState([]);
  const [totalTransactionsData, setTotalTransactionsData] = useState([]);
  const [transactionId, setTransactionId] = useState('');

  const [incomes, setIncomes] = useState(0);
  const [expenses, setExpenses] = useState(0);

  const [loading, setLoading] = useState(false);

  const [isClient, setIsClient] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();

  const customer_id = searchParams.get('customer_id');
  const supplier_id = searchParams.get('supplier_id');

  const [transaction, setTransaction] = useState({
    date: '',
    customer: '',
    supplier: '',
    transaction: '',
    amount: '',
    balance: '',
    note: '',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);

  const [role, setRole] = useState('');

  useEffect(() => {
    const fetchUserRole = async () => {
      const userRole = await getUserRole();

      setRole(userRole);
    };
    fetchUserRole();
  }, []);

  const handleDateChange = (newValue) => {
    setDate(newValue);
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const supplier_data = await axiosInstance('/supplier/get_suppliers', 'get');
      const customer_data = await axiosInstance('/customer/get_only_customers', 'get');

      let supplier_name = '';
      let customer_name = '';

      if (supplier_data !== undefined) {
        const data = supplier_data.data.data.find((item) => item._id === supplier_id);

        if (data) {
          supplier_name = data.name;
        }
      }

      if (customer_data !== undefined) {
        const data = customer_data.data.data.find((item) => item._id === customer_id);

        if (data) {
          customer_name = `${data.firstName} ${data.lastName}`;
        }
      }

      setCustomer(customer_name !== '' ? customer_name : t('Select a customer'));
      setSupplier(supplier_name !== '' ? supplier_name : t('Select a supplier'));

      const response = await axiosInstance('/transaction/get_transactions', 'get', {
        customer: customer_name,
        supplier: supplier_name,
        approve_status: 1,
        keyword: '',
        date: '',
        pageNum: currentPage,
        pageSize: transactionsPerPage,
      });

      setIncomes(response.data.incomes);
      setExpenses(response.data.expenses);

      setTotalPages(response.data.totalPage);
      setTransactionData(response.data.transactions || []);
      setTotalTransactionsData(response.data.totalTransactions);
      setLoading(false);
    };
    if (isClient) fetchData();
  }, [isChanged, currentPage, transactionsPerPage, role, isClient, customer_id, supplier_id, t]);

  const filterData = async () => {
    setLoading(true);

    const filterDate = date.endDate ? formatDate(date.endDate) : '';

    console.log(customer, supplier);

    const response = await axiosInstance('/transaction/get_transactions', 'get', {
      customer: customer,
      supplier: supplier,
      keyword: keyword,
      date: filterDate,
      approve_status: 1,
      pageNum: currentPage,
      pageSize: transactionsPerPage,
    });

    setIncomes(response.data.incomes);
    setExpenses(response.data.expenses);

    setTotalPages(response.data.totalPage);
    setTransactionData(response.data.transactions || []);
    setTotalTransactionsData(response.data.totalTransactions);
    setLoading(false);
  };

  useEffect(() => {
    const fetchSuppliersData = async () => {
      const response = await axiosInstance('/supplier/get_suppliers', 'get');
      setSuppliers(response.data.data);
    };
    const fetchCustomersData = async () => {
      const response = await axiosInstance('/customer/get_only_customers', 'get');
      setCustomers(response.data.data);
    };

    fetchCustomersData();
    fetchSuppliersData();
  }, []);

  const deleteTransaction = async (id) => {
    const response = await axiosInstance('/transaction/delete_transaction', 'delete', {
      transaction_id: id,
    });

    if (response.status === 200) {
      toast.success(t('Transaction and associated attachments deleted successfully'));
    } else {
      toast.warning(response.data.message);
    }

    setIsChanged(!isChanged);
  };

  const resetFilter = () => {
    setCustomer('');
    setSupplier('');
    setKeyword('');
    setIsClient(true);
    setDate({
      startDate: null,
      endDate: null,
    });

    setIsChanged(!isChanged);

    searchParams.set('customer_id', '');
    searchParams.set('supplier_id', '');

    setSearchParams(searchParams);

    console.log(customer, supplier);
  };

  const showModal = (attachment) => {
    setSelectedAttachment(attachment);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAttachment(null);
  };

  const exportToExcel = () => {
    if (transactionData.length === 0) {
      toast.warning('No transactions to export.');
      return;
    }

    const excelData = totalTransactionsData.map((item) => ({
      'Transaction Date': new Date(item.transaction_date).toLocaleDateString(),
      'Customer Name': `${item.customer.firstName} ${item.customer.lastName}`,
      'Supplier Name': item.supplier.name,
      'Transaction Type': item.transaction_type,
      Amount: item.amount,
      Balance: item.balance,
      Notes: item.notes,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    XLSX.writeFile(workbook, 'Transactions.xlsx');
  };

  const selectStyles = {
    control: (styles, { isFocused }) => ({
      ...styles,
      backgroundColor: 'var(--bg-color)',
      borderColor: isFocused ? 'var(--focus-border-color)' : isDarkMode ? '#fff' : '#e7e9ed',
      boxShadow: isFocused ? '0 0 0 1px var(--focus-border-color)' : 'none',
      '&:hover': {
        borderColor: isDarkMode ? '#fff' : '#e7e9ed',
      },
      color: isDarkMode ? '#fff' : '#000',
    }),
    menu: (styles) => ({
      ...styles,
      backgroundColor: isDarkMode ? '#1f2937' : '#fff',
      color: isDarkMode ? '#fff' : '#000',
    }),
    option: (styles, { isSelected, isFocused }) => ({
      ...styles,
      backgroundColor: isSelected
        ? isDarkMode
          ? '#4B5563'
          : '#E5E7EB'
        : isFocused
        ? isDarkMode
          ? '#374151'
          : '#F3F4F6'
        : 'transparent',
      color: isDarkMode ? '#fff' : '#000',
      '&:hover': {
        backgroundColor: isFocused ? (isDarkMode ? '#374151' : '#F3F4F6') : undefined,
      },
    }),
    singleValue: (styles) => ({
      ...styles,
      color: isDarkMode ? '#fff' : '#000',
    }),
    placeholder: (styles) => ({
      ...styles,
      color: isDarkMode ? '#fff' : '#e5e7eb',
    }),
  };

  const customerOptions = [
    { value: '', label: t('Select a customer'), isDisabled: true },
    ...customers.map((customer) => ({
      value: customer._id,
      label: `${customer.firstName} ${customer.lastName}`,
      isDisabled: false,
    })),
  ];

  const supplierOptions = [
    { value: '', label: t('Select a supplier'), isDisabled: true },
    ...suppliers.map((supplier) => ({
      value: supplier._id,
      label: supplier.name,
      isDisabled: false,
    })),
  ];

  return (
    <>
      <div className='w-full h-full'>
        <div className='mx-auto bg-white p-6 space-y-6 dark:bg-gray-800'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4'>
            <div>
              <label className='block text-gray-700 dark:text-gray-300'>
                {t('Records per Page')}
              </label>
              <select
                className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
                onChange={(e) =>
                  setTransactionsPerPage(e.target.value === 'All' ? '' : Number(e.target.value))
                }
              >
                <option value='15'>15</option>
                <option value='30'>30</option>
                <option value='50'>50</option>
                <option value='All'>{t('All')}</option>
              </select>
            </div>
            <div>
              <label className='block text-gray-700 dark:text-gray-300'>{t('Customer')}</label>
              {/* <input
                type='text'
                className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
                placeholder={t('Filter by customer')}
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
              /> */}
              <Select
                options={customerOptions}
                value={customerOptions.find((option) => option.label === customer)}
                onChange={(option) => setCustomer(option.label)}
                styles={selectStyles}
                placeholder={t('Select a customer')}
              />
            </div>
            <div>
              <label className='block text-gray-700 dark:text-gray-300'>{t('Supplier')}</label>
              {/* <input
                type='text'
                className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
                placeholder={t('Filter by supplier')}
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              /> */}
              <Select
                options={supplierOptions}
                value={supplierOptions.find((option) => option.label === supplier)}
                onChange={(option) => setSupplier(option.label)}
                styles={selectStyles}
                placeholder={t('Select a supplier')}
              />
            </div>
            <div>
              <label className='block text-gray-700 dark:text-gray-300'>{t('Keyword')}</label>
              <input
                type='text'
                className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
                placeholder={t('Filter by keyword')}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div>
              <label className='block text-gray-700 dark:text-gray-300'>{t('Date')}</label>
              <Datepicker
                name='transactionDate'
                i18n={i18n.language}
                value={date}
                onChange={handleDateChange}
                asSingle={true}
                useRange={false}
                placeholder={t('Select Date')}
                displayFormat={'DD/MM/YYYY'}
                showFooter={true}
                containerClassName='relative'
                popoverDirection='down'
                inputClassName='transition-all duration-300 py-2.5 pl-4 pr-14 w-full border dark:bg-gray-700 dark:border dark:border-white dark:text-white/80 rounded-lg tracking-wide font-light text-sm placeholder-gray-400 bg-white focus:ring disabled:opacity-40 disabled:cursor-not-allowed focus:border-blue-500 focus:ring-blue-500/20'
              />
            </div>
          </div>
          <div className='flex justify-end gap-4 max-md:flex-col'>
            <div className='flex justify-end gap-4 max-md:justify-between'>
              <button
                className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none max-md:w-full'
                onClick={() => {
                  filterData();
                  setCurrentPage(1);
                }}
              >
                {t('Search')}
              </button>
              <button
                className='px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none max-md:w-full'
                onClick={resetFilter}
              >
                {t('Reset')}
              </button>
            </div>
            <div className='flex justify-end gap-4 max-md:justify-between'>
              {role !== 'customer' && (
                <button
                  className='px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none max-md:w-full'
                  onClick={() => {
                    setShowTransactionForm(true);
                    setType('Add');
                  }}
                >
                  {t('Add New Record')}
                </button>
              )}
              <button
                className='px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none max-md:w-full'
                onClick={exportToExcel}
              >
                {t('Export to Excel')}
              </button>
            </div>
          </div>

          <div className='overflow-x-auto'>
            {loading === true ? (
              <div className='w-full h-[200px] flex justify-center items-center'>
                <LoadingOutlined className='text-[40px]' />
              </div>
            ) : (
              <table className='w-full text-left bg-white rounded-lg max-2xl:min-w-[1200px] dark:bg-gray-800'>
                <thead>
                  <tr className='text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700'>
                    <th className='p-3'>#</th>
                    <th className='p-3'>{t('Date')}</th>
                    <th className='p-3'>{t('Customer')}</th>
                    <th className='p-3'>{t('Supplier')}</th>
                    <th className='p-3'>{t('Transaction')}</th>
                    <th className='p-3'>{t('Note')}</th>
                    <th className='p-3'>{t('Amount')}</th>
                    <th className='p-3'>{t('Payment')}</th>
                    <th className='p-3'>{t('Attachments')}</th>
                    <th className='p-3'>{t('Action')}</th>
                  </tr>
                </thead>

                <tbody>
                  {transactionData.map((item, index) => (
                    <tr key={item._id || `transaction-${index}`}>
                      <td className='p-3 border-[1px] dark:border-gray-600 dark:text-gray-300'>
                        {index + 1 + transactionsPerPage * (currentPage - 1)}
                      </td>
                      <td className='p-3 border-[1px] dark:border-gray-600 dark:text-gray-300'>
                        {(() => {
                          const date = new Date(item.transaction_date);
                          const formattedDate = date.toISOString().split('T')[0];
                          return formattedDate;
                        })()}
                      </td>
                      <td className='p-3 border-[1px] dark:border-gray-600 dark:text-gray-300'>
                        {item.customer?.firstName} {item.customer?.lastName}
                      </td>
                      <td className='p-3 border-[1px] dark:border-gray-600 dark:text-gray-300'>
                        {item.supplier?.name}
                      </td>
                      <td className='p-3 border-[1px] dark:border-gray-600 dark:text-gray-300'>
                        {item.transaction_type === 'invoice'
                          ? t('invoice')
                          : item.transaction_type === 'payment'
                          ? t('payment')
                          : t('return')}
                      </td>
                      <td className='p-3 border-[1px] dark:border-gray-600 dark:text-gray-300'>
                        {item.notes}
                      </td>
                      <td
                        className={`p-3 ${
                          item.transaction_type === 'invoice' ? 'text-[green]' : 'text-[red]'
                        } border-[1px] dark:border-gray-600 dark:text-gray-300`}
                      >
                        {item.transaction_type === 'invoice' && item.amount.toLocaleString()}
                      </td>
                      <td
                        className={`p-3 ${
                          item.transaction_type === 'invoice' ? 'text-[green]' : 'text-[red]'
                        } border-[1px] dark:border-gray-600 dark:text-gray-300`}
                      >
                        {item.transaction_type !== 'invoice' && '-'}
                        {item.transaction_type !== 'invoice' && item.amount.toLocaleString()}
                      </td>
                      <td className='p-3 border-[1px] dark:border-gray-600 dark:text-gray-300'>
                        {item.attachments.length > 0
                          ? item.attachments.map((attachment, index) => {
                              const fileName = attachment.split('/').pop();
                              const fileType = fileName.split('.').pop();

                              return (
                                <div
                                  key={index}
                                  className='text-blue-500 cursor-pointer hover:underline'
                                  onClick={() => {
                                    showModal(attachment);
                                  }}
                                >
                                  {`${t('Attachment')}-${index}(${fileType.toUpperCase()})`}{' '}
                                </div>
                              );
                            })
                          : t('No attachments')}
                      </td>
                      <td className='py-2 px-4 border-[1px] dark:border-gray-600 dark:text-gray-300'>
                        <button
                          className='text-gray-800 py-1 rounded mr-1 dark:text-white'
                          onClick={() => {
                            setType('Edit');
                            console.log(item.transaction_date);

                            setTransaction({
                              date: item.transaction_date,
                              customer: item.customer?._id || null,
                              supplier: item.supplier?._id || null,
                              transaction: item.transaction_type,
                              amount: item.amount,
                              balance: item.balance,
                              note: item.notes,
                            });
                            setTransactionId(item._id);
                            setShowTransactionForm(true);
                          }}
                        >
                          <FaRegEdit />
                        </button>

                        {role !== 'customer' && (
                          <button
                            className='text-gray-800 py-1 rounded mr-1 dark:text-white ml-[20px]'
                            onClick={() => {
                              deleteTransaction(item._id);
                            }}
                          >
                            <MdDelete />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td
                      className='py-2 px-4 text-center text-[red]  border-[1px] dark:border-gray-600'
                      colSpan={2}
                    >
                      {t('Total')}
                    </td>
                    <td
                      className='py-2 px-4 text-center text-[green] border-[1px] dark:border-gray-600'
                      colSpan={2}
                    >
                      {t('Invoice')}: {incomes.toLocaleString()}
                    </td>
                    <td
                      className='py-2 px-4 text-center text-[red] border-[1px] dark:border-gray-600'
                      colSpan={role === 'admin' ? 4 : 5}
                    >
                      {t('Payment')}: {expenses > 0 && '-'}
                      {expenses.toLocaleString()}
                    </td>
                    <td
                      className='py-2 px-4 text-center text-[green] border-[1px] dark:border-gray-600'
                      colSpan={2}
                    >
                      {t('Balance')}:{' '}
                      <span className={incomes - expenses >= 0 ? `text-[green]` : `text-[red]`}>
                        {(incomes - expenses).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <div className='mt-4 flex justify-between'>
            <button
              className={`bg-gray-300 text-gray-700 px-4 py-2 rounded ${
                currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              {t('Previous')}
            </button>
            <button
              className={`bg-gray-300 text-gray-700 px-4 py-2 rounded ${
                currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              {t('Next')}
            </button>
          </div>
        </div>
      </div>
      <TransactionForm
        customers={customers}
        suppliers={suppliers}
        showTransactionForm={showTransactionForm}
        setShowTransactionForm={setShowTransactionForm}
        transaction={transaction}
        type={type}
        onClose={() => setShowTransactionForm(false)}
        setIsChanged={setIsChanged}
        isChanged={isChanged}
        transactionId={transactionId}
        setLoading={setLoading}
      />

      <Modal
        title={t('Attachment Preview')}
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
        width={900}
        className='top-[40px]'
      >
        {selectedAttachment ? (
          selectedAttachment.toLowerCase().endsWith('.pdf') ? (
            <iframe
              src={`${imageUrl}/${selectedAttachment}`}
              className='w-full h-[800px] rounded-md'
              title={`title-${selectedAttachment}`}
            />
          ) : (
            <img
              src={`${imageUrl}/${selectedAttachment}`}
              alt={t('Attachment Preview')}
              className='w-full h-auto rounded-md'
            />
          )
        ) : (
          <p>{t('No attachment selected.')}</p>
        )}
      </Modal>
    </>
  );
};
