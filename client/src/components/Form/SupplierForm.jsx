import { Modal } from 'antd';
import { ThemeProvider } from 'antd-style';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useState } from 'react';

const SupplierForm = ({ showSupplierForm, onClose, onSubmit, supplier, setSupplier, type }) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDarkMode = useSelector((state) => state.darkMode.isDarkMode);

  if (!showSupplierForm) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemeProvider appearance={isDarkMode ? 'dark' : 'light'}>
      <Modal open={showSupplierForm} onOk={handleSubmit} onCancel={onClose} footer={[]}>
        <h2 className='text-2xl font-bold mb-4 dark:text-white'>
          {type === 'Add' ? t('Add New Supplier') : t('Edit supplier')}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label className='block text-gray-700 dark:text-gray-300'>{t('Name')}</label>
            <input
              type='text'
              className='w-full px-3 py-2 border border-black rounded-md dark:bg-gray-700 dark:text-gray-300 dark:border-white'
              value={supplier.name}
              name='name'
              onChange={(e) => setSupplier((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className='mb-4'>
            <label className='block text-gray-700 dark:text-gray-300'>{t('Email')}</label>
            <input
              type='email'
              className='w-full px-3 py-2 border border-black rounded-md dark:bg-gray-700 dark:text-gray-300 dark:border-white'
              value={supplier.email}
              name='email'
              onChange={(e) => setSupplier((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <div className='mb-4'>
            <label className='block text-gray-700 dark:text-gray-300'>{t('Phone Number')}</label>
            <input
              type='text'
              className='w-full px-3 py-2 border border-black rounded-md dark:bg-gray-700 dark:text-gray-300 dark:border-white'
              value={supplier.phoneNumber}
              name='phone'
              onChange={(e) => setSupplier((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              required
            />
          </div>
          <div className='mb-4'>
            <label className='block text-gray-700 dark:text-gray-300'>{t('Home Address')}</label>
            <input
              type='text'
              className='w-full px-3 py-2 border border-black rounded-md dark:bg-gray-700 dark:text-gray-300 dark:border-white'
              value={supplier.homeAddress}
              name='home_address'
              onChange={(e) => setSupplier((prev) => ({ ...prev, homeAddress: e.target.value }))}
              required
            />
          </div>
          <div className='flex justify-end'>
            <button
              type='button'
              className='bg-gray-500 text-white px-4 py-2 rounded mr-2'
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t('Cancel')}
            </button>
            <button
              type='submit'
              className='bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50'
              disabled={isSubmitting}
            >
              {isSubmitting ? t('Processing...') : type === 'Add' ? t('Add') : t('Edit')}
            </button>
          </div>
        </form>
      </Modal>
    </ThemeProvider>
  );
};

export default SupplierForm;
