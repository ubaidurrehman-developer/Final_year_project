import { Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  ProtectedRoute,
  Layout,
  Home,
  Login,
  Admin,
  Student,
  UserRegistration,
  ForgotPassword,
  Detection,
  WorkflowManagement,
} from './index';
import Lenis from 'lenis';


function App() {
  const [role, setRole] = useState(null);

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
          <Route path='/admin/registration' element={<UserRegistration />} />
          <Route path={`/forgot-password`} element={<ForgotPassword />} />
          <Route path='/detection' element={<Detection />} />
          <Route path={'/admin/workflow'} element={<WorkflowManagement />} />
        </Routes>
      </Layout>
    </div>
  );
}

export default App;
