import React, { Suspense, lazy } from "react";
import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { ProtectedRoute, Layout } from './index';

// Lazy load pages
const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/Login'));
const Admin = lazy(() => import('../pages/Admin'));
const Student = lazy(() => import('../pages/Student'));
const UserRegistration = lazy(() => import('../pages/UserRegistration'));
const ForgotPassword = lazy(() => import('../pages/ResetPassword'));
const Detection = lazy(() => import('../pages/Detection'));
const WorkflowManagement = lazy(() => import('../pages/WorkflowManagement'));
import Lenis from 'lenis';


function App() {
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

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="App">
      <Layout>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path='/login' element={<Login />} />
            <Route
              path='/admin'
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path='/student'
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Student />
                </ProtectedRoute>
              }
            />
            <Route
              path='/admin/registration'
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserRegistration />
                </ProtectedRoute>
              }
            />
            <Route
              path={`/forgot-password`}
              element={<ForgotPassword />}
            />
            <Route
              path='/detection'
              element={
                <ProtectedRoute allowedRoles={['admin', 'student']}>
                  <Detection />
                </ProtectedRoute>
              }
            />
            <Route
              path='/admin/workflow'
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <WorkflowManagement />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </Layout>
    </div>
  );
}

export default App;
