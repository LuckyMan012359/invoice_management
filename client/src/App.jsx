import React, { useEffect } from 'react';

import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { useCookies } from 'react-cookie';
import 'react-toastify/dist/ReactToastify.css';

import { Layout } from './components/Layout/Layout';
import { router } from './router/router';

function App() {
  const [cookies] = useCookies(['token']);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/login');
    }
  }, [location.pathname, navigate, cookies.token]);

  return (
    <div className='App'>
      <Layout>
        <Routes>
          {router.map((route) => {
            if (cookies.token) {
              if (route.path === '/login') {
                return (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={<Navigate to='/dashboard' replace />}
                  />
                );
              }
              return <Route key={route.path} path={route.path} element={route.element} />;
            } else {
              if (route.path !== '/login') {
                return (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={<Navigate to='/login' replace />}
                  />
                );
              }
              return <Route key={route.path} path={route.path} element={route.element} />;
            }
          })}
          <Route path='*' element={<Navigate to='/dashboard' replace />} />
        </Routes>
      </Layout>
    </div>
  );
}

export default App;
