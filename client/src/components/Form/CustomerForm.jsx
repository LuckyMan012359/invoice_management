import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Switch, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';
import { useSelector } from 'react-redux';

const CustomerForm = ({
  showCustomerForm,
  onClose,
  onSubmit,
  customer,
  setCustomer,
  type,
  isChangePassword,
  setIsChangePassword,
}) => {
  const { t } = useTranslation();

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isDarkMode = useSelector((state) => state.darkMode.isDarkMode);

  if (!showCustomerForm) return null;

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'customer', label: 'Customer' },
  ];

  const handleSelectChange = (selectedOption, field) => {
    setCustomer((prev) => ({
      ...prev,
      [field]: selectedOption ? selectedOption.value : '',
    }));
  };

  const selectStyles = {
    control: (styles, { isFocused }) => ({
      ...styles,
      backgroundColor: isDarkMode === true && '#374151',
      borderColor: isFocused ? 'var(--focus-border-color)' : 'var(--border-color)',
      boxShadow: isFocused ? '0 0 0 1px var(--focus-border-color)' : 'none',
      '&:hover': {
        borderColor: 'var(--hover-border-color)',
      },
      color: isDarkMode ? '#fff' : '#000', // Change the text color based on dark mode
    }),
    menu: (styles) => ({
      ...styles,
      backgroundColor: isDarkMode ? '#1f2937' : '#fff', // Dark mode background for the menu
      color: isDarkMode ? '#fff' : '#000', // Text color in the menu
    }),
    option: (styles, { isSelected, isFocused }) => ({
      ...styles,
      backgroundColor: isSelected
        ? isDarkMode
          ? '#4B5563'
          : '#E5E7EB' // selected option background color
        : isFocused
        ? isDarkMode
          ? '#374151'
          : '#F3F4F6' // focused option background color
        : 'transparent',
      color: isDarkMode ? '#fff' : '#000', // Change text color for options
      '&:hover': {
        backgroundColor: isFocused ? (isDarkMode ? '#374151' : '#F3F4F6') : undefined,
      },
    }),
    singleValue: (styles) => ({
      ...styles,
      color: isDarkMode ? '#fff' : '#000', // Text color for the selected value
    }),
  };

  return (
    <div className='fixed inset-0 flex items-center justify-center z-[101] bg-black bg-opacity-50'>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md'>
        <h2 className='text-2xl font-bold mb-4 dark:text-white'>Add New Customer</h2>
        <form onSubmit={onSubmit}>
          <div className='mb-4'>
            <label className='block text-gray-700 dark:text-gray-300'>{t('First Name')}</label>
            <input
              type='text'
              className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
              value={customer.firstName}
              name='name'
              onChange={(e) =>
                setCustomer((prev) => ({ ...prev, firstName: e.target.value || '' }))
              }
              required
            />
          </div>

          <div className='mb-4'>
            <label className='block text-gray-700 dark:text-gray-300'>{t('Last Name')}</label>
            <input
              type='text'
              className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
              value={customer.lastName}
              name='name'
              onChange={(e) => setCustomer((prev) => ({ ...prev, lastName: e.target.value }))}
              required
            />
          </div>

          <div className='mb-4'>
            <label className='block text-gray-700 dark:text-gray-300'>{t('Email')}</label>
            <input
              type='email'
              className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
              value={customer.email}
              name='email'
              onChange={(e) => setCustomer((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className='mb-4'>
            <label className='block text-gray-700 dark:text-gray-300'>{t('Role')}</label>
            {type === 'Edit' &&
            (customer.totalBalance !== 0 ||
              customer.totalPayment !== 0 ||
              customer.totalPurchase !== 0 ||
              customer.totalReturn !== 0) ? (
              <Tooltip
                placement='bottom'
                title="You can't change customer's role because he has transaction."
              >
                <Select
                  options={roleOptions}
                  value={roleOptions.find((option) => option.value === customer.transactionType)}
                  onChange={(option) => handleSelectChange(option, 'transactionType')}
                  styles={selectStyles}
                  placeholder='Select a transaction type'
                  isDisabled={
                    type === 'Edit' &&
                    (customer.totalBalance !== 0 ||
                      customer.totalPayment !== 0 ||
                      customer.totalPurchase !== 0 ||
                      customer.totalReturn !== 0)
                  }
                />
              </Tooltip>
            ) : (
              <Select
                options={roleOptions}
                value={roleOptions.find((option) => option.value === customer.transactionType)}
                onChange={(option) => handleSelectChange(option, 'transactionType')}
                styles={selectStyles}
                placeholder='Select a transaction type'
                isDisabled={
                  type === 'Edit' &&
                  (customer.totalBalance !== 0 ||
                    customer.totalPayment !== 0 ||
                    customer.totalPurchase !== 0 ||
                    customer.totalReturn !== 0)
                }
              />
            )}
          </div>

          <div className='mb-4'>
            <label className='block text-gray-700 dark:text-gray-300'>{t('Phone Number')}</label>
            <input
              type='text'
              className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
              value={customer.phoneNumber}
              name='phone'
              onChange={(e) => setCustomer((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              required
            />
          </div>

          <div className='mb-4'>
            <label className='block text-gray-700 dark:text-gray-300'>{t('Home Address')}</label>
            <input
              type='text'
              className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
              value={customer.homeAddress}
              name='home_address'
              onChange={(e) => setCustomer((prev) => ({ ...prev, homeAddress: e.target.value }))}
              required
            />
          </div>

          {type === 'Edit' && (
            <div className='mb-4 flex justify-between'>
              <label className='block text-gray-700 dark:text-gray-300'>
                {t('Change Password')}
              </label>
              <Switch size='small' value={isChangePassword} onChange={setIsChangePassword} />
            </div>
          )}
          {isChangePassword === true && type === 'Edit' ? (
            <div className='mb-4'>
              <label className='block text-gray-700 dark:text-gray-300'>{t('Password')}</label>
              <div className='flex items-center justify-end'>
                <input
                  type={isPasswordVisible ? 'text' : 'password'}
                  className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300 pr-10'
                  name='password'
                  onChange={(e) => setCustomer((prev) => ({ ...prev, password: e.target.value }))}
                  required={type !== 'Edit'}
                />
                <button
                  type='button'
                  onClick={() => setIsPasswordVisible((prev) => !prev)}
                  className='absolute mr-3'
                >
                  {isPasswordVisible ? (
                    <FaEyeSlash className='dark:text-gray-400' />
                  ) : (
                    <FaEye className='dark:text-gray-400' />
                  )}
                </button>
              </div>
            </div>
          ) : type === 'Add' ? (
            <div className='mb-4'>
              <label className='block text-gray-700 dark:text-gray-300'>Password</label>
              <div className='flex items-center justify-end'>
                <input
                  type={isPasswordVisible ? 'text' : 'password'}
                  className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300 pr-10'
                  name='password'
                  onChange={(e) => setCustomer((prev) => ({ ...prev, password: e.target.value }))}
                  required={type !== 'Edit'}
                />
                <button
                  type='button'
                  onClick={() => setIsPasswordVisible((prev) => !prev)}
                  className='absolute mr-3'
                >
                  {isPasswordVisible ? (
                    <FaEyeSlash className='dark:text-gray-400' />
                  ) : (
                    <FaEye className='dark:text-gray-400' />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <></>
          )}
          <div className='flex justify-end'>
            <button
              type='button'
              className='bg-gray-500 text-white px-4 py-2 rounded mr-2'
              onClick={onClose}
            >
              Cancel
            </button>
            <button type='submit' className='bg-green-500 text-white px-4 py-2 rounded'>
              {type === 'Add' ? 'Add' : 'Edit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
