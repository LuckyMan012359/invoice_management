import { useEffect, useState } from 'react';
import Datepicker from 'react-tailwindcss-datepicker';
import { useTranslation } from 'react-i18next';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import getUserRole from '../../utils/getUserRole';

const TransactionForm = ({
  customers,
  suppliers,
  showTransactionForm,
  setShowTransactionForm,
  type,
  onClose,
  transaction,
  setIsChanged,
  isChanged,
  transactionId,
}) => {
  const { t, i18n } = useTranslation();

  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const role = await getUserRole();

      setUserRole(role);
    };

    fetchData();
  }, []);

  const [formData, setFormData] = useState({
    customerId: '',
    supplierId: '',
    transactionType: '',
    amount: '',
    notes: '',
    date: { startDate: '', endDate: '' },
    attachments: [],
  });

  const [updateAttachments, setUpdateAttachments] = useState(false);
  const [removeAttachments, setRemoveAttachments] = useState(false);

  const resetForm = () => {
    setFormData({
      customerId: '',
      supplierId: '',
      transactionType: '',
      amount: '',
      notes: '',
      date: { startDate: '', endDate: '' },
      attachments: [],
    });

    setUpdateAttachments(false);
    setRemoveAttachments(false);
  };

  useEffect(() => {
    if (type === 'Edit' && transaction) {
      setFormData({
        customerId: transaction.customer || '',
        supplierId: transaction.supplier || '',
        transactionType: transaction.transaction || '',
        amount: transaction.amount || '',
        notes: transaction.note || '',
        date: {
          startDate: transaction.date ? new Date(transaction.date) : '',
          endDate: transaction.date ? new Date(transaction.date) : '',
        },
        attachments: [],
      });
    }
  }, [type, transaction]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleDateChange = (newValue) => {
    setFormData((prevData) => ({
      ...prevData,
      date: newValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formattedData = new FormData();
    formattedData.append('customer_id', formData.customerId);
    formattedData.append('supplier_id', formData.supplierId);
    formattedData.append('transaction_type', formData.transactionType);
    formattedData.append('amount', formData.amount);
    formattedData.append('notes', formData.notes);
    formattedData.append('transaction_id', transactionId ? transactionId : '');
    formattedData.append('isRemove', removeAttachments);

    const rawDate = formData.date.startDate;
    if (rawDate) {
      const formattedDate = new Date(rawDate).toISOString().split('T')[0];
      formattedData.append('transaction_date', formattedDate);
    }

    if (e.target.attachments && e.target.attachments.files?.length > 0) {
      for (let i = 0; i < e.target.attachments.files.length; i++) {
        formattedData.append('attachments', e.target.attachments.files[i]);
      }
    }

    if (removeAttachments === true) {
      formattedData.append('attachments', []);
    }

    try {
      if (userRole === 'admin') {
        if (type === 'Add') {
          const response = await axiosInstance(
            '/transaction/create_transaction',
            'post',
            formattedData,
          );
          toast.success(response.data.message);
          setShowTransactionForm(false);
          setIsChanged(!isChanged);
        } else {
          const response = await axiosInstance(
            '/transaction/update_transaction',
            'put',
            formattedData,
          );
          toast.success(response.data.message);
          setShowTransactionForm(false);
          setIsChanged(!isChanged);
        }
      } else {
        formattedData.append('original_transaction', transactionId);

        const response = await axiosInstance(
          '/pending/create_pending_transaction',
          'post',
          formattedData,
        );
        toast.success(response.data.message);
        setShowTransactionForm(false);
        setIsChanged(!isChanged);
      }
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  if (!showTransactionForm) return null;

  return (
    <div className='fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50'>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-lg h-auto overflow-y-auto scrollbar-transparent'>
        <h2 className='text-2xl font-bold mb-4 dark:text-white'>{`${type} Transaction`}</h2>
        <form onSubmit={handleSubmit} encType='multipart/form-data'>
          <div className='mb-4'>
            <label className='block text-gray-700 dark:text-gray-300 dark:text-gray-300'>
              {t('Date')}
            </label>
            <Datepicker
              required
              i18n={i18n.language}
              value={formData.date}
              onChange={handleDateChange}
              asSingle={true}
              useRange={false}
              displayFormat={'DD/MM/YYYY'}
              inputClassName='relative transition-all duration-300 py-2.5 pl-4 pr-14 w-full border dark:bg-gray-700 dark:border dark:border-white dark:text-white/80 rounded-lg tracking-wide font-light text-sm placeholder-gray-400 bg-white focus:ring disabled:opacity-40 disabled:cursor-not-allowed focus:border-blue-500 focus:ring-blue-500/20'
            />
          </div>

          <div className='mb-4'>
            <label className='block text-gray-700 dark:text-gray-300'>{t('Customer')}</label>
            <div className='relative'>
              <select
                name='customerId'
                value={formData.customerId}
                onChange={handleChange}
                required
                className='block appearance-none w-full bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-white rounded-md py-2 px-4 pr-8 leading-tight focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 dark:focus:border-blue-400'
                disabled={userRole === 'customer'}
              >
                <option value='' disabled>
                  Select a customer
                </option>
                {customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.firstName} {customer.lastName}
                  </option>
                ))}
              </select>
              <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300'>
                <svg
                  className='fill-current h-4 w-4'
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 20 20'
                >
                  <path d='M5.5 8.5L10 13l4.5-4.5H5.5z' />
                </svg>
              </div>
            </div>
          </div>

          <div className='mb-4'>
            <label className='block text-gray-700 dark:text-gray-300'>{t('Supplier')}</label>
            <div className='relative'>
              <select
                name='supplierId'
                value={formData.supplierId}
                onChange={handleChange}
                required
                className='block appearance-none w-full bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-white rounded-md py-2 px-4 pr-8 leading-tight focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 dark:focus:border-blue-400'
                disabled={userRole === 'customer'}
              >
                <option value='' disabled>
                  Select a supplier
                </option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300'>
                <svg
                  className='fill-current h-4 w-4'
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 20 20'
                >
                  <path d='M5.5 8.5L10 13l4.5-4.5H5.5z' />
                </svg>
              </div>
            </div>
          </div>

          <div className='mb-4'>
            <label className='block text-gray-700 dark:text-gray-300'>
              {t('Transaction Type')}
            </label>
            <select
              name='transactionType'
              value={formData.transactionType}
              onChange={handleChange}
              required
              className='block appearance-none w-full bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-white rounded-md py-2 px-4 pr-8 leading-tight focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 dark:focus:border-blue-400'
            >
              <option value='' disabled>
                Select a transaction type
              </option>
              <option value='invoice'>INVOICE</option>
              <option value='payment'>PAYMENTS</option>
              <option value='return'>RETURN</option>
            </select>
          </div>

          <div className='mb-4'>
            <label className='block text-gray-700 dark:text-gray-300'>{t('Amount')}</label>
            <input
              type='number'
              name='amount'
              value={formData.amount}
              onChange={handleChange}
              className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
              required
            />
          </div>

          <div className='mb-4'>
            <label className='block text-gray-700 dark:text-gray-300'>{t('Notes')}</label>
            <textarea
              name='notes'
              value={formData.notes}
              className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
              onChange={handleChange}
              required={userRole !== 'admin'}
            />
          </div>

          {type === 'Edit' && (
            <>
              <div className='mb-4'>
                <label className='inline-flex items-center'>
                  <input
                    type='checkbox'
                    checked={removeAttachments}
                    onChange={() => setRemoveAttachments(!removeAttachments)}
                    className='form-checkbox'
                  />
                  <span className='ml-2 text-gray-700 dark:text-gray-300'>
                    {t('Remove Attachments')}
                  </span>
                </label>
              </div>
              <div className='mb-4'>
                <label className='inline-flex items-center'>
                  <input
                    type='checkbox'
                    checked={updateAttachments}
                    onChange={() => setUpdateAttachments(!updateAttachments)}
                    className='form-checkbox'
                    disabled={removeAttachments === true}
                  />
                  <span className='ml-2 text-gray-700 dark:text-gray-300'>
                    {t('Update Attachments')}
                  </span>
                </label>
              </div>
            </>
          )}

          {(updateAttachments || type === 'Add') && (
            <div className='mb-4'>
              <label className='block text-gray-700 dark:text-gray-300'>{t('Attachments')}</label>
              <input
                className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
                type='file'
                multiple
                accept='image/*, application/pdf'
                name='attachments'
              />
            </div>
          )}

          <div className='flex justify-end'>
            <button
              type='button'
              className='bg-gray-500 text-white px-4 py-2 rounded mr-2'
              onClick={() => {
                onClose();
                resetForm();
              }}
            >
              {t('Cancel')}
            </button>
            <button type='submit' className='bg-green-500 text-white px-4 py-2 rounded'>
              {type === 'Add' ? t('Add') : t('Edit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
