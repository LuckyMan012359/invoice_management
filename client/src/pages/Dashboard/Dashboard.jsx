import React from 'react';
import { useTranslation } from 'react-i18next';
import ColumnChartComponent from '../../components/Chat/ColumnChartComponent';
import axiosInstance from '../../utils/axiosInstance';

export const Dashboard = () => {
  const { t } = useTranslation();
  const [totalPurchase, setTotalPurchase] = React.useState(0);
  const [totalPayment, setTotalPayment] = React.useState(0);
  const [totalReturn, setTotalReturn] = React.useState(0);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance('/transaction/total_transaction_value', 'get');

        setTotalPurchase(response.data.TotalPurchases);
        setTotalPayment(response.data.TotalPayments);
        setTotalReturn(response.data.TotalReturns);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className='w-full h-auto px-[100px] pb-[50px] pt-[200px] max-2xl:px-[50px]'>
      <div className='grid grid-cols-4 max-2xl:grid-cols-3 max-xl:grid-cols-2 max-lg:grid-cols-1 gap-[70px] m-5 dark:text-white'>
        <div className='rounded-md h-24 border-2 flex flex-col shadow-md'>
          <p className='p-2'>{t('Total Sales')}</p>
          <p className='flex items-center justify-center text-2xl'>
            ${totalPurchase.toLocaleString()}
          </p>
        </div>
        <div className='rounded-md h-24 border-2 shadow-md'>
          <p className='p-2'>{t('Total Payments')}</p>
          <p className='flex items-center justify-center text-2xl'>
            ${totalPayment.toLocaleString()}
          </p>
        </div>
        <div className='rounded-md h-24 border-2 shadow-md'>
          <p className='p-2'>{t('Total Returns')}</p>
          <p className='flex items-center justify-center text-2xl'>
            ${totalReturn.toLocaleString()}
          </p>
        </div>
        <div className='rounded-md h-24 border-2 shadow-md'>
          <p className='p-2'>{t('Total Balance')}</p>
          <p className='flex items-center justify-center text-2xl'>
            ${(totalPurchase - totalPayment - totalReturn).toLocaleString()}
          </p>
        </div>
      </div>
      <ColumnChartComponent type='invoice' />
      <ColumnChartComponent type='payment' />
      <ColumnChartComponent type='return' />
    </div>
  );
};
