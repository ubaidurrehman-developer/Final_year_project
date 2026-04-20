import { useLocation } from 'react-router-dom';
import { LandingNavbar, Navbar, Footer } from '../src/index';

const Layout = ({ children }) => {
    const location = useLocation();

    const noNavbar = ['/login', '/forgot-password'];
    const noFooterRoutes = ['/admin', '/student', '/login', '/admin/registration', '/admin/workflow', '/forgot-password', '/detection'];
    const hideFooter = noFooterRoutes.includes(location.pathname);
    const hideNavbar = noNavbar.includes(location.pathname);
    const isLandingPage = location.pathname === '/';

    // Pages with sidebar need left offset on desktop
    const hasSidebar = !isLandingPage && !hideNavbar;

    return (
        <div className="min-h-screen flex flex-col font-sans text-[var(--page-text)] relative overflow-hidden bg-[var(--page-bg)] transition-colors duration-300 pb-24 md:pb-0">
            {/* Background blobs */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--page-bg)] via-[var(--page-bg)] to-[var(--page-bg)]" />
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-600 rounded-full blur-[100px] animate-blob" style={{ opacity: 'var(--blob-opacity)' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-600 rounded-full blur-[100px] animate-blob animation-delay-2000" style={{ opacity: 'var(--blob-opacity)' }} />
                <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-blue-600 rounded-full blur-[100px] animate-blob animation-delay-4000" style={{ opacity: 'var(--blob-opacity)' }} />
            </div>

            {isLandingPage ? (
                <LandingNavbar />
            ) : (
                hideNavbar ? null : <Navbar />
            )}

            <main className={`flex-grow relative z-10 transition-all duration-300 ${hasSidebar ? 'md:ml-[72px]' : ''}`}>
                {children}
            </main>

            {!hideFooter && <Footer />}
        </div>
    );
};

export default Layout;
