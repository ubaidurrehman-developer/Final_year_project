import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, GraduationCap, Sun, Moon, Twitter, Linkedin, Facebook, Instagram, Mail, ArrowRight, Heart } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Layout = ({ children }) => {
    const location = useLocation();    

    if (location.pathname === '/login') {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen flex flex-col font-sans text-[var(--page-text)] relative overflow-hidden bg-[var(--page-bg)] transition-colors duration-300 pb-24 md:pb-0">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--page-bg)] via-[var(--page-bg)] to-[var(--page-bg)]" />
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-600 rounded-full blur-[100px] animate-blob" style={{ opacity: 'var(--blob-opacity)' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-600 rounded-full blur-[100px] animate-blob animation-delay-2000" style={{ opacity: 'var(--blob-opacity)' }} />
                <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-blue-600 rounded-full blur-[100px] animate-blob animation-delay-4000" style={{ opacity: 'var(--blob-opacity)' }} />
            </div>

            <Navbar />

            <main className="flex-grow relative z-10">
                {children}
            </main>
        
            <Footer />
        </div>
    );
};

export default Layout;
