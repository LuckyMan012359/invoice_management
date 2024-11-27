import { useTranslation } from 'react-i18next';
import ColumnChartComponent from '../../components/Chat/ColumnChartComponent';

export const Dashboard = () => {
  const { t } = useTranslation();

  return (
    <div className='h-full w-full px-[100px]'>
      <div className='grid grid-cols-3 gap-[70px] m-5 dark:text-white'>
        <div className='rounded-md h-24 border-2 flex flex-col shadow-md'>
          <p className='p-2'>{t('Total Sales')}</p>
          <p className='flex items-center justify-center text-2xl'>$100000</p>
        </div>
        <div className='rounded-md h-24 border-2 shadow-md'>
          <p className='p-2'>{t('Total Payments')}</p>
          <p className='flex items-center justify-center text-2xl'>$50000</p>
        </div>
        <div className='rounded-md h-24 border-2 shadow-md'>
          <p className='p-2'>{t('Total Balance')}</p>
          <p className='flex items-center justify-center text-2xl'>$50000</p>
        </div>
      </div>
      <ColumnChartComponent type='invoice' />
      <ColumnChartComponent type='payment' />
    </div>
  );
};
