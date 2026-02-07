import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, GraduationCap, ShieldCheck, LogIn, LogOut, Settings, Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ role, setRole }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { toggleTheme, theme } = useTheme(); // Assuming these exist in context

    const handleLogout = () => {
        setRole(null);
        navigate("/login");
    };

    // Define navigation items with their respective icons and roles replacement
    // Mapping existing routes to icons requested or suitable equivalents
    const navItems = [
        { name: 'Home', path: '/', icon: Home, roles: ['admin', 'student'] },
        { name: 'Student', path: '/student', icon: GraduationCap, roles: ['student'] },
        { name: 'Admin', path: '/admin', icon: ShieldCheck, roles: ['admin'] },
        // Added purely visual items if they were to exist, but currently only showing functional ones
        // { name: 'Messages', path: '/messages', icon: MessageSquare, roles: ['admin', 'student'] },
    ];

    const visibleItems = role ? navItems.filter((item) => item.roles.includes(role)) : [];

    return (
        <div className="fixed top-4 left-4 z-50 h-[calc(100vh-2rem)] hidden md:flex flex-col justify-center">
            {/* 
                Navbar Container 
                - Pill shape
                - White background with shadow
                - Fixed position
            */}
            <motion.nav
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.05)] py-6 flex flex-col items-center gap-2 h-auto max-h-full overflow-y-auto w-20 no-scrollbar dark:bg-[#171717]/90 dark:border-white/10"
            >
                {/* Logo / Brand or Top Item */}
                <div className="mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-400/10 flex items-center justify-center text-primary-400">
                        <div className="w-4 h-4 rounded-full bg-current" />
                    </div>
                </div>

                {/* Navigation Links */}
                <ul className="flex flex-col gap-3 w-full px-3">
                    {visibleItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <li key={item.name} className="relative group">
                                <Link
                                    to={item.path}
                                    className={`
                                        relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300
                                        ${isActive
                                            ? 'text-white bg-primary-400 shadow-lg shadow-primary-400/30'
                                            : 'text-gray-400 hover:text-white hover:bg-primary-400 dark:text-gray-500'
                                        }
                                    `}
                                >
                                    <Icon size={24} strokeWidth={2} />

                                    {/* Slide-out Text Label */}
                                    <span
                                        className="
                                            absolute left-[85%] top-1/2 -translate-y-1/2 ml-3
                                            px-3 py-1.5 rounded-xl
                                            bg-white dark:bg-[#262626] border border-gray-100 dark:border-white/10
                                            shadow-lg
                                            text-primary-600 dark:text-primary-400 font-semibold text-sm whitespace-nowrap
                                            opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-4
                                            pointer-events-none transition-all duration-300 ease-out z-20
                                        "
                                    >
                                        {item.name}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}

                    {/* Divider */}
                    <div className="w-full h-px bg-gray-100 dark:bg-white/10 my-2" />

                    {/* Theme Toggle (Optional but fits 'Settings') */}
                    <li className="relative group">
                        <button
                            onClick={toggleTheme}
                            className="
                                relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300
                                text-gray-400 hover:text-white hover:bg-primary-400 dark:text-gray-500
                            "
                        >
                            <Palette size={24} strokeWidth={2} />
                            <span
                                className="
                                    absolute left-[85%] top-1/2 -translate-y-1/2 ml-3
                                    px-3 py-1.5 rounded-xl
                                    bg-white dark:bg-[#262626] border border-gray-100 dark:border-white/10
                                    shadow-lg
                                    text-primary-600 dark:text-primary-400 font-semibold text-sm whitespace-nowrap
                                    opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-4
                                    pointer-events-none transition-all duration-300 ease-out z-20
                                "
                            >
                                Theme
                            </span>
                        </button>
                    </li>
                </ul>

                {/* Bottom Actions (Login/Logout) */}
                <div className="mt-auto px-3 pb-2 w-full flex flex-col gap-3">
                    {!role ? (
                        <Link to="/login" className="relative group">
                            <div className="
                                flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300
                                bg-gray-50 text-gray-400 hover:bg-primary-400 hover:text-white
                                dark:bg-white/5 dark:text-gray-500
                             ">
                                <LogIn size={24} strokeWidth={2} />
                            </div>
                            <span className="
                                absolute left-[85%] top-1/2 -translate-y-1/2 ml-3
                                px-3 py-1.5 rounded-xl
                                bg-white dark:bg-[#262626] border border-gray-100 dark:border-white/10
                                shadow-lg
                                text-primary-600 dark:text-primary-400 font-semibold text-sm whitespace-nowrap
                                opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-4
                                pointer-events-none transition-all duration-300 ease-out z-20
                             ">
                                Sign In
                            </span>
                        </Link>
                    ) : (
                        <button onClick={handleLogout} className="relative group">
                            <div className="
                                flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300
                                bg-red-50 text-red-400 hover:bg-red-500 hover:text-white
                                dark:bg-white/5
                             ">
                                <LogOut size={24} strokeWidth={2} />
                            </div>
                            <span className="
                                absolute left-[85%] top-1/2 -translate-y-1/2 ml-3
                                px-3 py-1.5 rounded-xl
                                bg-white dark:bg-[#262626] border border-gray-100 dark:border-white/10
                                shadow-lg
                                text-red-500 font-semibold text-sm whitespace-nowrap
                                opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-4
                                pointer-events-none transition-all duration-300 ease-out z-20
                            ">
                                Logout
                            </span>
                        </button>
                    )}
                </div>
            </motion.nav>

            {/* Mobile Bottom Bar (Fallback for smaller screens) */}
            <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-200 md:hidden z-50 px-6 py-4 flex justify-between items-center dark:bg-[#171717]/90 dark:border-white/10">
                {visibleItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                        <Link key={item.name} to={item.path} className={`flex flex-col items-center gap-1 ${isActive ? 'text-primary-400' : 'text-gray-400'}`}>
                            <Icon size={24} />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    )
                })}
                <button onClick={toggleTheme} className="text-gray-400">
                    <Palette size={24} />
                </button>
            </div>
        </div>
    );
};

export default Navbar;
