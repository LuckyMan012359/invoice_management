import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CustomerForm from '../../components/Form/CustomerForm';
import { FaRegEdit } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import { LoadingOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { Button } from 'antd';
import { IoIosEyeOff, IoIosEye } from 'react-icons/io';

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
    totalBalance: 0,
    totalPayment: 0,
    totalPurchase: 0,
    totalReturn: 0,
  });
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [customersPerPage, setCustomersPerPage] = useState(15);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isChanged, setIsChanged] = useState(false);

  const [loading, setLoading] = useState(false);

  const [incomes, setIncomes] = useState(0);
  const [expenses, setExpenses] = useState(0);

  const [showValue, setShowValue] = useState(false);

  const handleShowValue = () => {
    setShowValue(!showValue);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const response = await axiosInstance('/customer/get_customers', 'get', {
          pageNum: currentPage,
          pageSize: customersPerPage,
          keyword: keyword,
        });

        const customerGroup = response.data.data.filter((user) => user.role === 'customer');
        const adminGroup = response.data.data.filter((user) => user.role === 'admin');
        const groupedData = [...customerGroup, ...adminGroup];

        setFilteredCustomers(groupedData);

        setTotalPages(response.data.meta.totalPages);

        setIncomes(response.data.incomes || 0);
        setExpenses(response.data.expenses || 0);

        setLoading(false);
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

    setLoading(true);

    setIsChanged(false);
    if (type === 'Add') {
      const response = await axiosInstance('/customer/add_customer', 'post', customer);

      if (response.status === 409) {
        toast.warning(t("Customer already exist. Please update customer's info."));
      } else {
        toast.success(t('Customer created successfully'));
      }
    } else {
      const updateData = {
        _id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        role: customer.role,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
        homeAddress: customer.homeAddress,
        password: !isChangePassword ? '' : customer.password,
      };

      const response = await axiosInstance('/customer/update_customer', 'put', updateData);
      if (response.status === 200 || response.status === 201) {
        toast.success(t('Customer updated successfully'));
      } else {
        toast.error(response.data.message);
      }
      setShowCustomerForm(false);
    }

    resetForm();
    setIsChanged(true);
  };

  const resetForm = () => {
    setCustomer({
      id: 0,
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      homeAddress: '',
      password: '',
      role: 'default',
      totalBalance: 0,
      totalPayment: 0,
      totalPurchase: 0,
      totalReturn: 0,
    });
  };

  const deleteCustomer = async (deleteCustomer) => {
    if (
      deleteCustomer.totalPurchase !== 0 ||
      deleteCustomer.totalPayment !== 0 ||
      deleteCustomer.totalReturn !== 0
    ) {
      toast.error(t("You can't delete this customer because he has transaction."));
      return;
    }
    setLoading(true);
    setIsChanged(false);
    const response = await axiosInstance(`/customer/delete_customer`, 'delete', {
      deleteCustomerID: deleteCustomer._id,
    });
    if (response.status === 200) {
      toast.success(t('Customer deleted successfully'));
    } else {
      toast.error(response.data.message);
    }
    setIsChanged(true);
  };

  return (
    <div className='min-h-screen px-[100px] pb-[50px] pt-[200px] max-xl:px-[50px] max-sm:px-[15px] bg-gray-300 dark:bg-gray-900 overflow-hidden'>
      <div className='max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6 space-y-6 dark:bg-gray-800'>
        <div className='flex justify-between max-md:flex-col gap-4 mb-4'>
          <div className='flex justify-start gap-4 max-md:w-full max-sm:flex-col'>
            <div className='w-full'>
              <label className='block text-gray-700 dark:text-gray-300'>
                {t('Customers per Page')}
              </label>
              <select
                className='w-full px-3 py-2 border border-gray-400 rounded-md dark:bg-gray-700 dark:text-gray-300'
                onChange={(e) =>
                  setCustomersPerPage(e.target.value === 'All' ? '' : Number(e.target.value))
                }
              >
                <option value='15'>15</option>
                <option value='30'>30</option>
                <option value='50'>50</option>
                <option value='All'>{t('All')}</option>
              </select>
            </div>
            <div className='flex flex-col w-full'>
              <label className='block text-gray-700 dark:text-gray-300'>{t('Keyword')}</label>
              <input
                type='text'
                className='w-full px-3 py-2 border border-gray-400 rounded-md dark:bg-gray-700 dark:text-gray-300'
                placeholder={`${t('Filter by keyword')}(${t('First Name')}, ${t('Last Name')}, ${t(
                  'Phone Number',
                )}, ${t('Home Address')})`}
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                }}
              />
            </div>
          </div>
          <div className='flex items-end justify-end gap-4'>
            <Button
              variant='filled'
              type='primary'
              className='h-10 w-20 text-xl'
              onClick={handleShowValue}
            >
              {showValue ? <IoIosEyeOff /> : <IoIosEye />}
            </Button>
            <button
              className='px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none max-md:w-full'
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
          {loading === true ? (
            <div className='w-full h-[200px] flex justify-center items-center'>
              <LoadingOutlined className='text-[40px]' />
            </div>
          ) : (
            <table className='w-full text-left bg-white rounded-lg max-2xl:min-w-[1200px] dark:bg-gray-800'>
              <thead>
                <tr className='text-gray-700 dark:text-gray-300 bg-gray-300 dark:bg-gray-700 border-[1px] border-gray-400 dark:border-gray-600'>
                  <th className='py-2 px-4 text-left'>{t('Name')}</th>
                  <th className='py-2 px-4 text-left'>{t('Total Purchases')}</th>
                  <th className='py-2 px-4 text-left'>{t('Total Payments')}</th>
                  <th className='py-2 px-4 text-left'>{t('Balance')}</th>
                  <th className='py-2 px-4 text-left'>{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer._id || `customer-${index}`} className='border-b'>
                    <td className='py-2 px-4 border-[1px] border-gray-400 dark:border-gray-600 dark:text-gray-300'>
                      {customer.role !== 'admin' ? (
                        <Link to={`/transactions?customer_id=${customer._id}&&supplier_id=`}>
                          {customer.firstName} {customer.lastName}
                        </Link>
                      ) : (
                        <>
                          {customer.firstName} {customer.lastName}
                        </>
                      )}
                    </td>
                    {customer.role === 'admin' ? (
                      <>
                        <td
                          className='py-2 px-4 text-center border-[1px] border-gray-400 dark:border-gray-600 dark:text-gray-300'
                          colSpan={3}
                        >
                          {t('Admin')}
                        </td>
                      </>
                    ) : (
                      <>
                        <td
                          className={`${
                            showValue ? 'blur-0' : 'blur-lg'
                          } py-2 px-4 text-[green] border-[1px] border-gray-400 dark:border-gray-600 dark:text-gray-300`}
                        >
                          {customer.totalPurchase.toLocaleString() || 0}
                        </td>
                        <td
                          className={`${
                            showValue ? 'blur-0' : 'blur-lg'
                          } py-2 px-4 text-[red] border-[1px] border-gray-400 dark:border-gray-600 dark:text-gray-300`}
                        >
                          {customer.totalPayment > 0 && '-'}
                          {customer.totalPayment.toLocaleString() || 0}
                        </td>
                        <td
                          className={`py-2 px-4 ${
                            customer.totalBalance >= 0 ? 'text-[green]' : 'text-[red]'
                          } border-[1px] border-gray-400 dark:border-gray-600 dark:text-gray-300`}
                        >
                          {customer.totalBalance.toLocaleString() || 0}
                        </td>
                      </>
                    )}
                    <td className='py-2 px-4 border-[1px] border-gray-400 dark:border-gray-600 dark:text-gray-300'>
                      <button
                        className='text-gray-800 py-1 rounded dark:text-white mr-[15px]'
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
                        onClick={() => deleteCustomer(customer)}
                      >
                        <MdDelete />
                      </button>
                    </td>
                  </tr>
                ))}

                <tr>
                  <td
                    className='py-2 px-4 text-center text-[red] border-[1px] border-gray-400 dark:border-gray-600'
                    colSpan={1}
                  >
                    {t('Total')}
                  </td>
                  <td
                    className={`${
                      showValue ? 'blur-0' : 'blur-lg'
                    } py-2 px-4 text-center text-[green] border-[1px] border-gray-400 dark:border-gray-600`}
                    colSpan={1}
                  >
                    {t('Invoice')}: {incomes.toLocaleString()}
                  </td>
                  <td
                    className={`${
                      showValue ? 'blur-0' : 'blur-lg'
                    } py-2 px-4 text-center text-[red] border-[1px] border-gray-400 dark:border-gray-600`}
                    colSpan={1}
                  >
                    {t('Payment')}: {expenses > 0 && '-'}
                    {expenses.toLocaleString()}
                  </td>
                  <td
                    className='py-2 px-4 text-center text-[green] border-[1px] border-gray-400 dark:border-gray-600'
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
