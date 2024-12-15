import { useTranslation } from 'react-i18next';
import 'react-datepicker/dist/react-datepicker.css';
import { useState } from 'react';
import { Tabs } from 'antd';
import { TransactionTable } from '../../components/Tables/transactionTable';
import { TransactionPendingTable } from '../../components/Tables/transactionPendingTable';
import { TransactionCreateApproveTable } from '../../components/Tables/transactionCreateApproveTable';
import { TransactionUpdateApproveTable } from '../../components/Tables/transactionUpdateApproveTable';

const { TabPane } = Tabs;

export const Transactions = () => {
  const { t } = useTranslation();

  const [isChanged, setIsChanged] = useState(false);

  return (
    <div className='min-h-screen px-[100px] pb-[50px] pt-[200px] max-xl:px-[50px] max-sm:px-[15px] bg-gray-100 dark:bg-gray-900'>
      <div className='mx-auto bg-white shadow-md rounded-lg p-6 space-y-6 dark:bg-gray-800'>
        <Tabs defaultActiveKey='1'>
          <TabPane
            tab={t('Transactions')}
            key='1'
            className='!text-[#000] dark:!text-[#fff]'
            style={{ color: '#444' }}
          >
            <TransactionTable isChanged={isChanged} setIsChanged={setIsChanged} />
          </TabPane>
          <TabPane
            tab={t('Pending Transactions')}
            key='2'
            className='!text-[#000] dark:!text-[#fff]'
          >
            <TransactionPendingTable isChanged={isChanged} setIsChanged={setIsChanged} />
          </TabPane>
          <TabPane
            tab={t('Approve Create Transaction')}
            key='3'
            className='!text-[#000] dark:!text-[#fff]'
          >
            <TransactionCreateApproveTable isChanged={isChanged} setIsChanged={setIsChanged} />
          </TabPane>
          <TabPane
            tab={t('Approve Update Transaction')}
            key='4'
            className='!text-[#000] dark:!text-[#fff]'
          >
            <TransactionUpdateApproveTable isChanged={isChanged} setIsChanged={setIsChanged} />
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};
