import React, { useEffect } from 'react';

import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { useCookies } from 'react-cookie';
import 'react-toastify/dist/ReactToastify.css';

import { Layout } from './components/Layout/Layout';
import { router } from './router/router';

function App() {
  const [cookies, , removeCookie] = useCookies(['token']);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/login');
    }
  }, [location.pathname, navigate, cookies.token]);

  useEffect(() => {
    let timeoutId;
    const INACTIVE_TIMEOUT = 10 * 60 * 1000;

    const handleLogout = () => {
      removeCookie('token');
      navigate('/login');
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleLogout, INACTIVE_TIMEOUT);
    };

    if (cookies.token) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach((event) => {
        document.addEventListener(event, resetTimer);
      });

      resetTimer();

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        events.forEach((event) => {
          document.removeEventListener(event, resetTimer);
        });
      };
    }
  }, [cookies.token, navigate, removeCookie]);

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
