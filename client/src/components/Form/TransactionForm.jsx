import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import getUserRole from '../../utils/getUserRole';
import Select from 'react-select';
import { useSelector } from 'react-redux';
import { ThemeProvider } from 'antd-style';
import { DatePicker, ConfigProvider } from 'antd';
import enUS from 'antd/es/locale/en_US';
import esES from 'antd/es/locale/es_ES';
import dayjs from 'dayjs';

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
  setLoading,
}) => {
  const { t, i18n } = useTranslation();

  const [userRole, setUserRole] = useState('');

  const isDarkMode = useSelector((state) => state.darkMode.isDarkMode);

  const [locale, setLocale] = useState();

  useEffect(() => {
    setLocale(i18n.language === 'en' ? enUS : esES);
  }, [i18n.language]);

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
    date: '',
    attachments: [],
  });

  const [updateAttachments, setUpdateAttachments] = useState(false);
  const [removeAttachments, setRemoveAttachments] = useState(false);

  const resetForm = () => {
    setFormData({
      customerId: null,
      supplierId: null,
      transactionType: null,
      amount: '',
      notes: '',
      date: null,
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
        date: dayjs(transaction.date),
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

    if (!formData.customerId || !formData.supplierId || !formData.transactionType) {
      toast.error('Please fill all fields');
      return;
    }

    const formattedData = new FormData();
    formattedData.append('customer_id', formData.customerId);
    formattedData.append('supplier_id', formData.supplierId);
    formattedData.append('transaction_type', formData.transactionType);
    formattedData.append('amount', formData.amount);
    formattedData.append('notes', formData.notes);
    formattedData.append('transaction_id', transactionId ? transactionId : '');
    formattedData.append('isRemove', removeAttachments);

    const rawDate = formData.date;
    if (rawDate) {
      const formattedDate = rawDate.format('YYYY-MM-DD'); // Use dayjs's format method
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
          setLoading(true);
          await axiosInstance('/transaction/create_transaction', 'post', formattedData);
          toast.success(t('Transaction created successfully'));

          resetForm();
          setIsChanged(!isChanged);
        } else {
          setLoading(true);
          setShowTransactionForm(false);

          await axiosInstance('/transaction/update_transaction', 'put', formattedData);
          toast.success(t('Transaction updated successfully'));

          setIsChanged(!isChanged);
        }
        resetForm();
      } else {
        setLoading(true);
        formattedData.append('original_transaction', transactionId);
        setShowTransactionForm(false);

        await axiosInstance('/pending/create_pending_transaction', 'post', formattedData);
        toast.success(t('Transaction pending successfully'));
        setIsChanged(!isChanged);
        resetForm();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  if (!showTransactionForm) return null;

  const handleSelectChange = (selectedOption, name) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: selectedOption ? selectedOption.value : '',
    }));
  };

  const customerOptions = [
    { value: null, label: t('Select a customer'), isDisabled: true },
    ...customers.map((customer) => ({
      value: customer._id,
      label: `${customer.firstName} ${customer.lastName}`,
      isDisabled: false,
    })),
  ];

  const supplierOptions = [
    { value: null, label: t('Select a supplier'), isDisabled: true },
    ...suppliers.map((supplier) => ({
      value: supplier._id,
      label: supplier.name,
      isDisabled: false,
    })),
  ];

  const transactionTypeOptions = [
    { value: null, label: t('Select a transaction type'), isDisabled: true },
    { value: 'invoice', label: t('invoice'), isDisabled: false },
    { value: 'payment', label: t('payment'), isDisabled: false },
  ];

  const selectStyles = {
    control: (styles, { isFocused }) => ({
      ...styles,
      backgroundColor: 'var(--bg-color)',
      borderColor: isFocused ? 'var(--focus-border-color)' : 'var(--border-color)',
      boxShadow: isFocused ? '0 0 0 1px var(--focus-border-color)' : 'none',
      '&:hover': {
        borderColor: 'var(--hover-border-color)',
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
  };

  const formattedOptions = transactionTypeOptions.map((option) => ({
    ...option,
    label: option.label.toUpperCase(),
  }));

  return (
    <ConfigProvider locale={locale}>
      <ThemeProvider appearance={isDarkMode ? 'dark' : 'light'}>
        <div className='fixed top-0 left-0 w-screen h-screen flex justify-center py-[50px] z-[101] bg-black overflow-y-scroll bg-opacity-50'>
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-lg h-[800px]'>
            <h2 className='text-2xl font-bold mb-4 dark:text-white'>{`${
              type === 'Add' ? t('Add Transaction') : t('Edit Transaction')
            }`}</h2>
            <form onSubmit={handleSubmit} encType='multipart/form-data'>
              <div className='mb-4'>
                <label className='block text-gray-700 dark:text-gray-300'>{t('Date')}</label>
                <DatePicker
                  required
                  i18n={i18n.language}
                  value={formData.date}
                  onChange={handleDateChange}
                  displayFormat={'DD/MM/YYYY'}
                  placeholder='DD/MM/YYYY'
                  className='w-full'
                  size='large'
                />
              </div>

              <div className='mb-4'>
                <label className='block text-gray-700 dark:text-gray-300'>{t('Customer')}</label>
                <Select
                  options={customerOptions}
                  value={customerOptions.find((option) => option.value === formData.customerId)}
                  onChange={(option) => handleSelectChange(option, 'customerId')}
                  styles={selectStyles}
                  placeholder={t('Select a customer')}
                  isDisabled={userRole === 'customer'}
                  required
                />
              </div>

              <div className='mb-4'>
                <label className='block text-gray-700 dark:text-gray-300'>{t('Supplier')}</label>
                <Select
                  options={supplierOptions}
                  value={supplierOptions.find((option) => option.value === formData.supplierId)}
                  onChange={(option) => handleSelectChange(option, 'supplierId')}
                  styles={selectStyles}
                  placeholder={t('Select a supplier')}
                  required={(value) => value === null}
                />
              </div>

              <div className='mb-4'>
                <label className='block text-gray-700 dark:text-gray-300'>
                  {t('Transaction Type')}
                </label>
                <Select
                  options={formattedOptions}
                  value={formattedOptions.find(
                    (option) => option.value === formData.transactionType,
                  )}
                  onChange={(option) => handleSelectChange(option, 'transactionType')}
                  styles={selectStyles}
                  placeholder={t('Select a transaction type')}
                  required
                />
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
                  <label className='block text-gray-700 dark:text-gray-300'>
                    {t('Attachments')}
                  </label>
                  <input
                    className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
                    type='file'
                    multiple
                    accept='.jpg, .jpeg, .png, .webp, .jfif, .pdf'
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
      </ThemeProvider>
    </ConfigProvider>
  );
};

export default TransactionForm;
