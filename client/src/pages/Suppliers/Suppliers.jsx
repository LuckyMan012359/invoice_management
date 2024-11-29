import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaRegEdit } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import SupplierForm from '../../components/Form/SupplierForm';
import { LoadingOutlined } from '@ant-design/icons';

export const Suppliers = () => {
  const { t } = useTranslation();
  const [type, setType] = useState('');
  const [supplier, setSupplier] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    homeAddress: '',
  });
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [suppliersPerPage, setSuppliersPerPage] = useState(15);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isChanged, setIsChanged] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const response = await axiosInstance('/supplier/get_suppliers', 'get', {
        pageNum: currentPage,
        pageSize: suppliersPerPage,
        keyword: keyword,
      });
      setFilteredSuppliers(response.data.data);

      setTotalPages(response.data.meta.totalPages);

      setLoading(false);
    };

    fetchData();
  }, [keyword, currentPage, suppliersPerPage, isChanged]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (type === 'Add') {
      const response = await axiosInstance('/supplier/add_supplier', 'post', supplier);

      if (response.status === 201) {
        toast.success('Customer added successfully!');
        setIsChanged(!isChanged);
      } else {
        toast.warning(response.data.message);
        setIsChanged(!isChanged);
      }
    } else {
      const updateData = {
        _id: supplier._id,
        name: supplier.name,
        email: supplier.email,
        phoneNumber: supplier.phoneNumber,
        homeAddress: supplier.homeAddress,
      };

      const response = await axiosInstance('/supplier/update_supplier', 'put', updateData);
      if (response.status === 200 || response.status === 201) {
        toast.success('Customer updated successfully!');
      } else {
        toast.error(response.data.message);
      }
      setIsChanged(!isChanged);
    }
    resetForm();
    setShowSupplierForm(false);
  };

  const resetForm = () => {
    setSupplier({
      id: 0,
      name: '',
      email: '',
      phoneNumber: '',
      homeAddress: '',
    });
  };

  const deleteSupplier = async (deleteSupplierID) => {
    const response = await axiosInstance(`/supplier/delete_supplier`, 'delete', {
      deleteSupplierID,
    });
    if (response.status === 200) {
      toast.success(response.data.message);
    } else {
      toast.error(response.data.message);
    }
    setIsChanged(!isChanged);
  };

  return (
    <div className='min-h-screen px-[100px] pb-[50px] pt-[200px] max-xl:px-[50px] max-sm:px-[15px] bg-gray-100 dark:bg-gray-900 overflow-hidden'>
      <div className='max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6 space-y-6 dark:bg-gray-800'>
        <div className='flex justify-between max-md:flex-col gap-4 mb-4'>
          <div className='flex justify-start gap-4 max-md:w-full max-sm:flex-col'>
            <div className='w-full'>
              <label className='block text-gray-700 dark:text-gray-300'>
                {t('Suppliers per Page')}
              </label>
              <select
                className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
                onChange={(e) =>
                  setSuppliersPerPage(e.target.value === 'All' ? '' : Number(e.target.value))
                }
              >
                <option value='15'>15</option>
                <option value='30'>30</option>
                <option value='50'>50</option>
                <option value='All'>All</option>
              </select>
            </div>
            <div className='flex flex-col w-full'>
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
          </div>
          <div className='flex items-end justify-end'>
            <button
              className='px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none max-md:w-full'
              onClick={() => {
                setShowSupplierForm(true);
                setType('Add');
              }}
            >
              {t('Add New Supplier')}
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
                <tr className='text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700'>
                  <th className='py-2 px-4 text-left'>{t('Name')}</th>
                  <th className='py-2 px-4 text-left'>{t('Total Purchases')}</th>
                  <th className='py-2 px-4 text-left'>{t('Total Payments')}</th>
                  <th className='py-2 px-4 text-left'>{t('Total Returns')}</th>
                  <th className='py-2 px-4 text-left'>{t('Balance')}</th>
                  <th className='py-2 px-4 text-left'>{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className='border-b dark:border-gray-600 dark:text-gray-300'
                  >
                    <td className='py-2 px-4'>{supplier.name}</td>
                    <td className='py-2 px-4 text-[green]'>
                      {supplier.totalPurchase.toLocaleString()}
                    </td>
                    <td className='py-2 px-4 text-[red]'>
                      -{supplier.totalPayment.toLocaleString()}
                    </td>
                    <td className='py-2 px-4 text-[red]'>
                      -{supplier.totalReturn.toLocaleString()}
                    </td>
                    <td
                      className={`py-2 px-4 ${
                        supplier.totalBalance >= 0 ? 'text-[green]' : 'text-[red]'
                      }`}
                    >
                      {supplier.totalBalance.toLocaleString()}
                    </td>
                    <td className='py-2 px-4 flex gap-[20px]'>
                      <button
                        className='text-gray-800 py-1 rounded mr-1 dark:text-white'
                        onClick={() => {
                          setType('Edit');
                          setShowSupplierForm(true);
                          setSupplier(supplier);
                        }}
                      >
                        <FaRegEdit />
                      </button>
                      <button
                        className='text-gray-800 py-1 rounded mr-1 dark:text-white'
                        onClick={() => deleteSupplier(supplier._id)}
                      >
                        <MdDelete />
                      </button>
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
      <SupplierForm
        showSupplierForm={showSupplierForm}
        onClose={() => {
          setShowSupplierForm(false);
          resetForm();
        }}
        onSubmit={handleSubmit}
        supplier={supplier}
        setSupplier={setSupplier}
        type={type}
      />
    </div>
  );
};
