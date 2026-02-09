import { Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ProtectedRoute, Spinner, Layout, Home, Login, Admin, Student, UserRegistration, ForgotPassword } from './index';
import Lenis from 'lenis';

function App() {
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  // Initialize Lenis for smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

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
          <Route path="/" element={<Home />} />
          <Route path='/login' element={<Login setRole={setRole} />} />
          <Route
            path='/admin'
            element={
              <ProtectedRoute allowedRoles={['admin']} setRole={setRole} role={role}>
                <Admin setRole={setRole} />
              </ProtectedRoute>
            }
          />
          <Route
            path='/student'
            element={
              <ProtectedRoute allowedRoles={['student']} setRole={setRole} role={role}>
                <Student setRole={setRole} />
              </ProtectedRoute>
            }
          />
          <Route path='/registration' element={<UserRegistration />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />
        </Routes>
      </Layout>
    </div>
  );
}

export default App;
