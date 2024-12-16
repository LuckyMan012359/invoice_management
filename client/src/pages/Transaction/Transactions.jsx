import { useTranslation } from 'react-i18next';
import 'react-datepicker/dist/react-datepicker.css';
import { useState } from 'react';
import { io } from 'socket.io-client';
import { Badge, Tabs } from 'antd';
import { TransactionTable } from '../../components/Tables/transactionTable';
import { TransactionPendingTable } from '../../components/Tables/transactionPendingTable';
import { TransactionCreateApproveTable } from '../../components/Tables/transactionCreateApproveTable';
import { TransactionUpdateApproveTable } from '../../components/Tables/transactionUpdateApproveTable';

const { TabPane } = Tabs;

export const Transactions = () => {
  const backendDomain = process.env.REACT_APP_SOCKET_URL || 'wss://negociationalex.lat/api';

  const [approveCreateTransactionAmount, setApproveCreateTransactionAmount] = useState(0);
  const [approveUpdateTransactionAmount, setApproveUpdateTransactionAmount] = useState(0);
  const [pendingTransactionAmount, setPendingTransactionAmount] = useState(0);

  console.log(backendDomain);

  const socket = io(backendDomain, () => {
    console.log('Websocket connected');
  });

  socket.on('transactionDataUpdated', (data) => {
    console.log(data);

    if (data && data.transactions && data.transactions.length >= 0) {
      const approveCreateTransaction = data.transactions.filter(
        (item) => Number(item.approve_status) === 2,
      );

      const approveUpdateTransaction = data.transactions.filter(
        (item) => Number(item.approve_status) === 3,
      );

      setApproveCreateTransactionAmount(approveCreateTransaction.length || 0);
      setApproveUpdateTransactionAmount(approveUpdateTransaction.length || 0);
    }

    if (data && data.pendingTransactions && data.pendingTransactions.length >= 0) {
      setPendingTransactionAmount(data.pendingTransactions.length || 0);
    }
  });

  const { t } = useTranslation();

  const [isChanged, setIsChanged] = useState(false);
  const [tabNum, setTabNum] = useState('1');
  return (
    <div className='min-h-screen px-[100px] pb-[50px] pt-[200px] max-xl:px-[50px] max-sm:px-[15px] bg-gray-100 dark:bg-gray-900'>
      <div className='tabs mx-auto bg-white shadow-md rounded-lg p-6 space-y-6 dark:bg-gray-800'>
        <Tabs
          activeKey={tabNum}
          onChange={(key) => setTabNum(key)} // Updates the active tab
        >
          <TabPane
            tab={
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
            }
            key='1'
          >
            <TransactionTable isChanged={isChanged} setIsChanged={setIsChanged} />
          </TabPane>
          <TabPane
            tab={
              <Badge
                count={pendingTransactionAmount}
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
            }
            key='2'
          >
            <TransactionPendingTable isChanged={isChanged} setIsChanged={setIsChanged} />
          </TabPane>
          <TabPane
            tab={
              <Badge
                count={approveCreateTransactionAmount}
                showZero={false}
                overflowCount={99}
                className={`dark:!text-[#fff] ${
                  tabNum === '3'
                    ? '!text-[#1677ff] dark:!text-[#1677ff]'
                    : '!text-[#000] dark:!text-[#fff]'
                }`}
                size='small'
              >
                {t('Approve Create Transaction')}
              </Badge>
            }
            key='3'
          >
            <TransactionCreateApproveTable isChanged={isChanged} setIsChanged={setIsChanged} />
          </TabPane>
          <TabPane
            tab={
              <Badge
                count={approveUpdateTransactionAmount}
                showZero={false}
                overflowCount={99}
                className={`dark:!text-[#fff] ${
                  tabNum === '4'
                    ? '!text-[#1677ff] dark:!text-[#1677ff]'
                    : '!text-[#000] dark:!text-[#fff]'
                }`}
                size='small'
              >
                {t('Approve Update Transaction')}
              </Badge>
            }
            key='4'
          >
            <TransactionUpdateApproveTable isChanged={isChanged} setIsChanged={setIsChanged} />
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};
