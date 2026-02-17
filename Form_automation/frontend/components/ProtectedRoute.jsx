// Protected Route Component
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--page-bg)]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-[var(--text-muted)]">Loading...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && currentUser.role !== 'admin') {
        return <Navigate to="/student" replace />;
    }

    if (!requireAdmin && currentUser.role === 'admin') {
        return <Navigate to="/admin" replace />;
    }

    return children;
};

export default ProtectedRoute;
