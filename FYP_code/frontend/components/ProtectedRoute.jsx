import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api, Spinner } from '../src/index';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);  // Local state for authorization check

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.get('/me/');
                const fetchedRole = response.data.role;

                // Set local state for immediate authorization check
                setUserRole(fetchedRole);
            } catch (error) {
                // Clear both local and parent state on auth failure
                setUserRole(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (loading) {
        return <Spinner />
    }

    // Not authenticated - use LOCAL userRole state for security
    if (!userRole) {
        return <Navigate to="/login" replace />;
    }

    // Authenticated but wrong role - use LOCAL userRole state for security
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
