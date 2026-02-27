// Components
export { default as Alert } from '../components/Alert';
export { default as Footer } from '../components/Footer';
export { default as LandingNavbar } from '../components/LandingNavbar';
export { default as Navbar } from '../components/Navbar';
export { default as ProtectedRoute } from '../components/ProtectedRoute';
export { default as Spinner } from '../components/Spinner';

// Contexts
export { AlertProvider, useAlert } from '../context/AlertContext';
export { ThemeProvider, useTheme } from '../context/ThemeContext';

// Layouts
export { default as Layout } from '../layouts/Layout';

// Pages
export { default as Admin } from '../pages/Admin';
export { default as ForgotPassword } from '../pages/ResetPassword';
export { default as Home } from '../pages/Home';
export { default as Login } from '../pages/Login';
export { default as Student } from '../pages/Student';
export { default as UserRegistration } from '../pages/UserRegistration';
export { default as Detection } from '../pages/Detection';
export { default as WorkflowManagement } from '../pages/WorkflowManagement';

// API
export { default as api } from './api/axios';
