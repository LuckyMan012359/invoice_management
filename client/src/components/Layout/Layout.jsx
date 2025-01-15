import { useLocation } from 'react-router-dom';
import Header from '../Header/Header';
import { ToastContainer } from 'react-toastify';

export const Layout = ({ children }) => {
  const location = useLocation();

  const isLoginPage = location.pathname === '/login' || location.pathname === '/';

  return (
    <div className='min-h-screen dark:bg-gray-800 bg-gray-200 transition-colors duration-300'>
      <ToastContainer />
      {!isLoginPage && <Header />}
      {children}
    </div>
  );
};
