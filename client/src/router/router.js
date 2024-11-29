import { Login } from '../pages/Auth/Login';
import { Dashboard } from '../pages/Dashboard/Dashboard';
import { Transactions } from '../pages/Transaction/Transactions';
import { Customers } from '../pages/Customers/Customers';
import { Suppliers } from '../pages/Suppliers/Suppliers';
import Profile from '../pages/Profile/profile';

export const router = [
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/profile',
    element: <Profile />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/transactions',
    element: <Transactions />,
  },
  {
    path: '/customers',
    element: <Customers />,
  },
  {
    path: '/suppliers',
    element: <Suppliers />,
  },
];
