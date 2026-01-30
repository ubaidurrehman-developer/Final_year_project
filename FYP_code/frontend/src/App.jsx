import { Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import Layout from '../layouts/Layout';
import Spinner from '../components/Spinner';
import * as pages from '../pages'

function App() {
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  // Show loading state briefly on route change to prevent flash
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 150);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (isLoading && (location.pathname === '/admin' || location.pathname === '/student')) {
    return <Spinner />;
  }

  return (
    <div className="App">
      <Layout role={role} setRole={setRole}>
        <Routes>
          <Route path="/" element={<pages.Home />} />
          <Route path='/login' element={<pages.Login setRole={setRole} />} />
          <Route
            path='/admin'
            element={
              <ProtectedRoute allowedRoles={['admin']} setRole={setRole} role={role}>
                <pages.Admin setRole={setRole} />
              </ProtectedRoute>
            }
          />
          <Route
            path='/student'
            element={
              <ProtectedRoute allowedRoles={['student']} setRole={setRole} role={role}>
                <pages.Student setRole={setRole} />
              </ProtectedRoute>
            }
          />
          <Route path='/registration' element={<pages.Registration />} />
          <Route path='/forgot-password' element={<pages.ForgotPassword />} />
        </Routes>
      </Layout>
    </div>
  );
}

export default App;
