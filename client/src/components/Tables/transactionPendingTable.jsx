import { useTranslation } from 'react-i18next';
import 'react-datepicker/dist/react-datepicker.css';
import { useEffect, useState } from 'react';
import Datepicker from 'react-tailwindcss-datepicker';
import axiosInstance from '../../utils/axiosInstance';
import { LoadingOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

import { toast } from 'react-toastify';

import { MdDelete } from 'react-icons/md';

import { Modal } from 'antd';

import { Button } from 'antd';
import getUserRole from '../../utils/getUserRole';

const imageUrl = process.env.REACT_APP_IMAGE_URL;

export const TransactionPendingTable = ({ isChanged, setIsChanged }) => {
  const { t, i18n } = useTranslation();
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);

  const [userRole, setUserRole] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const role = await getUserRole();

      setUserRole(role);
    };

    fetchData();
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

      const response = await axiosInstance('/pending/get_pending_transactions', 'get', {
        customer: '',
        supplier: '',
        keyword: '',
        date: '',
        pageNum: currentPage,
        pageSize: transactionsPerPage,
      });

      setTotalPages(response.data.totalPage);
      setTransactionData(response.data.transactions);
      setTotalTransactionsData(response.data.totalTransactions);
      setLoading(false);
    };
    fetchData();
  }, [isChanged, currentPage, transactionsPerPage]);

  const filterData = async () => {
    setLoading(true);

    const filterDate = date.endDate ? formatDate(date.endDate) : '';

    const response = await axiosInstance('/pending/get_pending_transactions', 'get', {
      customer: customer,
      supplier: supplier,
      keyword: keyword,
      date: filterDate,
      pageNum: currentPage,
      pageSize: transactionsPerPage,
    });

    setTotalPages(response.data.totalPage);
    setTransactionData(response.data.transactions);
    setTotalTransactionsData(response.data.totalTransactions);
    setLoading(false);
  };

  const resetFilter = () => {
    setCustomer('');
    setSupplier('');
    setKeyword('');
    setDate({
      startDate: '',
      endDate: '',
    });

    setIsChanged(!isChanged);
  };

  const showModal = (attachment) => {
    setSelectedAttachment(attachment);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAttachment(null);
  };

  const deletePendingTransaction = async (id) => {
    const response = await axiosInstance('/pending/delete_pending_transaction', 'delete', {
      transaction_id: id,
    });

    if (response.status === 200) {
      toast.success(t('Transaction and associated attachments deleted successfully'));
    } else {
      toast.warning(response.data.message);
    }

    setIsChanged(!isChanged);
  };

  const allowPendingTransaction = async (id, allowStatus) => {
    const response = await axiosInstance('/pending/update_pending_transaction', 'put', {
      pending_transaction_id: id,
      allowStatus: allowStatus,
    });

    if (response.status === 200) {
      if (allowStatus === 'allow') {
        toast.success(t('Allow pending transaction successfully'));
      } else {
        toast.success(t('Disallow pending transaction successfully'));
      }
    } else {
      toast.warning(response.data.message);
    }

    setIsChanged(!isChanged);
  };

  const exportToExcel = () => {
    if (transactionData.length === 0) {
      toast.warning('No pending transactions to export.');
      return;
    }

    const excelData = totalTransactionsData.map((item) => ({
      'Transaction Date': new Date(item.transaction_date).toLocaleDateString(),
      'Customer Name': `${item.customer.firstName} ${item.customer.lastName}`,
      'Supplier Name': item.supplier.name,
      'Transaction Type': item.transaction_type,
      Amount: item.amount,
      Notes: item.notes,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    XLSX.writeFile(workbook, 'Transactions.xlsx');
  };

  return (
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
              <option value='All'>All</option>
            </select>
          </div>
          <div>
            <label className='block text-gray-700 dark:text-gray-300'>{t('Customer')}</label>
            <input
              type='text'
              className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
              placeholder='Filter by customer'
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            />
          </div>
          <div>
            <label className='block text-gray-700 dark:text-gray-300'>{t('Supplier')}</label>
            <input
              type='text'
              className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
              placeholder='Filter by supplier'
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />
          </div>
          <div>
            <label className='block text-gray-700 dark:text-gray-300'>{t('Keyword')}</label>
            <input
              type='text'
              className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
              placeholder='Filter by keyword'
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
              placeholder='Select Date'
              displayFormat={'DD/MM/YYYY'}
              showFooter={true}
              containerClassName='relative'
              popoverDirection='down'
              inputClassName='transition-all duration-300 py-2.5 pl-4 pr-14 w-full border dark:bg-gray-700 dark:border dark:border-white dark:text-white/80 rounded-lg tracking-wide font-light text-sm placeholder-gray-400 bg-white focus:ring disabled:opacity-40 disabled:cursor-not-allowed focus:border-blue-500 focus:ring-blue-500/20'
            />
          </div>
        </div>
        <div className='flex justify-end gap-4 max-md:flex-col'>
          <div className='flex justify-end gap-4 max-md:justify-center'>
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
          <div className='flex justify-end gap-4 max-md:justify-center'>
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
            <table className='w-full text-left bg-white rounded-lg dark:bg-gray-800'>
              <thead>
                <tr className='text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700'>
                  <th className='p-3'>#</th>
                  <th className='p-3'>{t('Date')}</th>
                  <th className='p-3'>{t('Customer')}</th>
                  <th className='p-3'>{t('Supplier')}</th>
                  <th className='p-3'>{t('Transaction')}</th>
                  <th className='p-3'>{t('Amount')}</th>
                  <th className='p-3'>{t('Note')}</th>
                  <th className='p-3'>{t('Attachments')}</th>
                  <th className='p-3'>{t('Action')}</th>
                </tr>
              </thead>
              <tbody>
                {transactionData.map((item, index) => (
                  <tr
                    key={item._id || `transaction-${index}`}
                    className='border-b dark:border-gray-600 dark:text-gray-300'
                  >
                    <td className='p-3'>{index + 1 + transactionsPerPage * (currentPage - 1)}</td>
                    <td className='p-3'>
                      {(() => {
                        const date = new Date(item.transaction_date);
                        const formattedDate = date.toISOString().split('T')[0];
                        return formattedDate;
                      })()}
                    </td>
                    <td className='p-3'>
                      {item.customer.firstName} {item.customer.lastName}
                    </td>
                    <td className='p-3'>{item.supplier.name}</td>
                    <td className='p-3'>{item.transaction_type}</td>
                    <td
                      className={`p-3 ${
                        item.transaction_type === 'invoice' ? 'text-[green]' : 'text-[red]'
                      }`}
                    >
                      {item.transaction_type !== 'invoice' && '-'}
                      {item.amount.toLocaleString()}
                    </td>
                    <td className='p-3'>{item.notes}</td>
                    <td className='p-3 flex flex-col'>
                      {item.attachments.length > 0
                        ? item.attachments.map((attachment, index) => {
                            // Extract file name from the attachment path
                            const fileName = attachment.split('/').pop(); // Gets the file name from the path
                            const fileType = fileName.split('.').pop(); // Extracts the file extension

                            return (
                              <div
                                key={index}
                                className='text-blue-500 cursor-pointer hover:underline'
                                onClick={() => {
                                  showModal(attachment);
                                }}
                              >
                                {`Attachment-${index}(${fileType.toUpperCase()})`}{' '}
                              </div>
                            );
                          })
                        : 'No attachments'}
                    </td>
                    <td className='py-2 px-4'>
                      {userRole === 'admin' ? (
                        <>
                          <Button
                            color='primary'
                            variant='solid'
                            onClick={() => allowPendingTransaction(item._id, 'allow')}
                          >
                            {t('Allow')}
                          </Button>
                          <Button
                            color='danger'
                            variant='solid'
                            onClick={() => allowPendingTransaction(item._id, 'disallow')}
                            className='ml-[15px]'
                          >
                            {t('Disallow')}
                          </Button>
                        </>
                      ) : (
                        <button
                          className='text-gray-800 py-1 rounded mr-1 dark:text-white ml-[20px]'
                          onClick={() => {
                            deletePendingTransaction(item._id);
                          }}
                        >
                          <MdDelete />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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
              alt='Attachment Preview'
              className='w-full h-auto rounded-md'
            />
          )
        ) : (
          <p>{t('No attachment selected.')}</p>
        )}
      </Modal>
    </div>
  );
};
