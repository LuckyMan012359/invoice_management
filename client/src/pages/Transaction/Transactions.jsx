import { useTranslation } from 'react-i18next';
import 'react-datepicker/dist/react-datepicker.css';
import { useEffect, useState } from 'react';
import { Badge, Tabs } from 'antd';
import { TransactionTable } from '../../components/Tables/transactionTable';
import { TransactionPendingTable } from '../../components/Tables/transactionPendingTable';
import { TransactionCreateApproveTable } from '../../components/Tables/transactionCreateApproveTable';
import { TransactionUpdateApproveTable } from '../../components/Tables/transactionUpdateApproveTable';
import axiosInstance from '../../utils/axiosInstance';

export const Transactions = () => {
  const { t } = useTranslation();

  const [isChanged, setIsChanged] = useState(false);
  const [tabNum, setTabNum] = useState('1');

  const [approveCreateTransactionsAmount, setApproveCreateTransactionsAmount] = useState(0);
  const [approveUpdatingTransactionsAmount, setApproveUpdatingTransactionsAmount] = useState(0);
  const [pendingTransactionsAmount, setPendingTransactionsAmount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const response = await axiosInstance('/transaction/get_transaction_data_amount', 'get', {});

      console.log(response.data);

      const approveCreateTransactions = response.data.transactions.filter(
        (item) => item.approve_status === 2,
      );

      const approveUpdatingTransactions = response.data.transactions.filter(
        (item) => item.approve_status === 3,
      );

      setApproveCreateTransactionsAmount(approveCreateTransactions.length);
      setApproveUpdatingTransactionsAmount(approveUpdatingTransactions.length);
      setPendingTransactionsAmount(response.data.pendingTransaction.length);
    };

    fetchData();
  }, [isChanged]);

  const items = [
    {
      key: '1',
      label: (
        <Badge
          dot={false}
          className={`dark:!text-[#fff] ${
            tabNum === '1'
              ? '!text-[#1677ff] dark:!text-[#1677ff]'
              : '!text-[#000] dark:!text-[#fff]'
          }`}
          size='small'
        >
          {t('Transactions')}
        </Badge>
      ),
      children: <TransactionTable isChanged={isChanged} setIsChanged={setIsChanged} />,
    },
    {
      key: '2',
      label: (
        <Badge
          count={pendingTransactionsAmount}
          showZero={false}
          overflowCount={99}
          className={`dark:!text-[#fff] ${
            tabNum === '2'
              ? '!text-[#1677ff] dark:!text-[#1677ff]'
              : '!text-[#000] dark:!text-[#fff]'
          }`}
          size='small'
        >
          {t('Pending Transactions')}
        </Badge>
      ),
      children: <TransactionPendingTable isChanged={isChanged} setIsChanged={setIsChanged} />,
    },
    {
      key: '3',
      label: (
        <Badge
          count={approveCreateTransactionsAmount}
          showZero={false}
          overflowCount={99}
          className={`dark:!text-[#fff] ${
            tabNum === '3'
              ? '!text-[#1677ff] dark:!text-[#1677ff]'
              : '!text-[#000] dark:!text-[#fff]'
          }`}
          size='small'
        >
          {t('Invoice Approval')}
        </Badge>
      ),
      children: <TransactionCreateApproveTable isChanged={isChanged} setIsChanged={setIsChanged} />,
    },
    {
      key: '4',
      label: (
        <Badge
          count={approveUpdatingTransactionsAmount}
          showZero={false}
          overflowCount={99}
          className={`dark:!text-[#fff] ${
            tabNum === '4'
              ? '!text-[#1677ff] dark:!text-[#1677ff]'
              : '!text-[#000] dark:!text-[#fff]'
          }`}
          size='small'
        >
          {t('Update Invoices')}
        </Badge>
      ),
      children: <TransactionUpdateApproveTable isChanged={isChanged} setIsChanged={setIsChanged} />,
    },
  ];

  return (
    <div className='min-h-screen px-[100px] pb-[50px] pt-[200px] max-xl:px-[50px] max-sm:px-[15px] bg-gray-100 dark:bg-gray-900'>
      <div className='tabs mx-auto bg-white shadow-md rounded-lg p-6 space-y-6 dark:bg-gray-800'>
        <Tabs activeKey={tabNum} onChange={(key) => setTabNum(key)} items={items} />
      </div>
    </div>
  );
};
