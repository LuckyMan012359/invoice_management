import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CustomerForm from '../../components/Form/CustomerForm';
import { FaRegEdit } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';

export const Customers = () => {
  const { t } = useTranslation();
  const [type, setType] = useState('');
  const [isChangePassword, setIsChangePassword] = useState(false);
  const [customer, setCustomer] = useState({
    id: 0,
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    phoneNumber: '',
    homeAddress: '',
    password: '',
  });
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [customersPerPage, setCustomersPerPage] = useState(15);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance('/customer/get_customers', 'get', {
          pageNum: currentPage,
          pageSize: customersPerPage,
          keyword: keyword,
        });

        setFilteredCustomers(response.data.data);

        setTotalPages(response.data.meta.totalPages);
      } catch (error) {
        console.error('Error fetching customers:', error.response || error.message);
      }
    };

    fetchData();
  }, [isChanged, keyword, currentPage, customersPerPage]);

  const validatePassword = (password) => {
    const minLength = /.{8,}/;
    const specialChar = /[!@#$%^&*(),.?":{}|<>]/;
    const number = /[0-9]/;
    const upperCase = /[A-Z]/;
    const lowerCase = /[a-z]/;

    if (!minLength.test(password)) return 'Password must be at least 8 characters long.';
    if (!specialChar.test(password)) return 'Password must include at least one special character.';
    if (!number.test(password)) return 'Password must include at least one number.';
    if (!upperCase.test(password)) return 'Password must include at least one uppercase letter.';
    if (!lowerCase.test(password)) return 'Password must include at least one lowercase letter.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const passwordError = validatePassword(customer.password);

    if (passwordError) {
      toast.error(passwordError);

      return;
    }

    setIsChanged(false);
    if (type === 'Add') {
      const response = await axiosInstance('/customer/add_customer', 'post', customer);

      if (response.status === 403 || response.status === 409) {
        toast.warning(response.data.message);
      } else {
        toast.success('Customer added successfully!');
      }
    } else {
      const updateData = {
        _id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
        homeAddress: customer.homeAddress,
        password: !isChangePassword ? '' : customer.password,
      };

      const response = await axiosInstance('/customer/update_customer', 'put', updateData);
      if (response.status === 200 || response.status === 201) {
        toast.success('Customer updated successfully!');
      } else {
        toast.error(response.data.message);
      }
    }

    resetForm();
    setShowCustomerForm(false);
    setIsChanged(true);
  };

  const resetForm = () => {
    setCustomer({
      id: 0,
      name: '',
      email: '',
      phoneNumber: '',
      homeAddress: '',
      password: '',
    });
    setIsChanged(false);
  };

  const deleteCustomer = async (deleteCustomerID) => {
    setIsChanged(false);
    const response = await axiosInstance(`/customer/delete_customer`, 'delete', {
      deleteCustomerID: deleteCustomerID,
    });
    if (response.status === 200) {
      toast.success(response.data.message);
    } else {
      toast.error(response.data.message);
    }
    setIsChanged(true);
  };

  return (
    <div className='h-screen p-6 bg-gray-100 dark:bg-gray-900 overflow-hidden'>
      <div className='max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6 space-y-6 dark:bg-gray-800'>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4'>
          <div>
            <label className='block text-gray-700 dark:text-gray-300'>
              {t('Customers per Page')}
            </label>
            <select
              className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
              value={customersPerPage}
              onChange={(e) => setCustomersPerPage(Number(e.target.value))}
            >
              <option value='15'>15</option>
              <option value='30'>30</option>
              <option value='50'>50</option>
            </select>
          </div>
          <div className='flex flex-col'>
            <label className='block text-gray-700 dark:text-gray-300'>{t('Keyword')}</label>
            <input
              type='text'
              className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
              placeholder={t('Filter by keyword')}
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
              }}
            />
          </div>
          <div className='hidden lg:block'></div>
          <div className='hidden lg:block'></div>
          <div className='flex items-end justify-end'>
            <button
              className='px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none'
              onClick={() => {
                setShowCustomerForm(true);
                setType('Add');
              }}
            >
              {t('Add New Customer')}
            </button>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full text-left bg-white rounded-lg dark:bg-gray-800'>
            <thead>
              <tr className='text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700'>
                <th className='py-2 px-4 text-left'>{t('Name')}</th>
                <th className='py-2 px-4 text-left'>{t('Total Purchases')}</th>
                <th className='py-2 px-4 text-left'>{t('Total Payments')}</th>
                <th className='py-2 px-4 text-left'>{t('Balance')}</th>
                <th className='py-2 px-4 text-left'>{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer, index) => (
                <tr
                  key={customer.id || `customer-${index}`}
                  className='border-b dark:border-gray-600 dark:text-gray-300'
                >
                  <td className='py-2 px-4'>
                    {customer.firstName} {customer.lastName}
                  </td>
                  {customer.role === 'admin' ? (
                    <>
                      <td className='py-2 px-4 text-center' colSpan={3}>
                        Admin
                      </td>
                    </>
                  ) : (
                    <>
                      <td className='py-2 px-4'>{customer.totalPurchase.toLocaleString() || 0}</td>
                      <td className='py-2 px-4'>{customer.totalPayment.toLocaleString() || 0}</td>
                      <td className='py-2 px-4'>{customer.totalBalance.toLocaleString() || 0}</td>
                    </>
                  )}
                  <td className='py-2 px-4 flex gap-[25px]'>
                    <button
                      className='text-gray-800 py-1 rounded mr-1 dark:text-white'
                      onClick={() => {
                        setType('Edit');
                        setShowCustomerForm(true);
                        setCustomer(customer);
                      }}
                    >
                      <FaRegEdit />
                    </button>
                    <button
                      className='text-gray-800 py-1 rounded mr-1 dark:text-white'
                      onClick={() => deleteCustomer(customer._id)}
                    >
                      <MdDelete />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            className={`bg-gray-300 text-gray-700 px-4 py-2 rounded
              ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            {t('Next')}
          </button>
        </div>
      </div>
      <CustomerForm
        showCustomerForm={showCustomerForm}
        onClose={() => {
          setShowCustomerForm(false);
          resetForm();
        }}
        onSubmit={handleSubmit}
        customer={customer}
        setCustomer={setCustomer}
        type={type}
        isChangePassword={isChangePassword}
        setIsChangePassword={setIsChangePassword}
      />
    </div>
  );
};
