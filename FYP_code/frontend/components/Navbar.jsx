import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import {
    ArrowLeft,
    ArrowRight,
    GraduationCap,
    ShieldCheck,
    LogIn,
    LogOut,
    UserPlus,
    CircleUser,
    Workflow,
    ScanLine
} from 'lucide-react';

import { useTheme } from '../context/ThemeContext';
import { api } from '../src/index';

const Navbar = ({ role, setRole }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme } = useTheme();

    const [isExpanded, setIsExpanded] = useState(true);

    const handleLogout = async () => {
        try {
            await api.post('/logout/', {}, { withCredentials: true });
        } catch (error) {
            console.log(error);
        }

        setRole(null);
        navigate('/');
    };

    const navItems = [
        { name: 'Profile', path: '/profile', icon: CircleUser, roles: ['admin', 'student'] },
        { name: 'Student', path: '/student', icon: GraduationCap, roles: ['student'] },
        { name: 'Admin', path: '/admin', icon: ShieldCheck, roles: ['admin'] },
        { name: 'Detection', path: '/detection', icon: ScanLine, roles: ['admin'] },
        { name: 'Registration', path: '/admin/registration', icon: UserPlus, roles: ['admin'] },
        { name: 'Workflow Management', path: '/admin/workflow', icon: Workflow, roles: ['admin'] },
    ];

    const visibleItems = role
        ? navItems.filter((item) => item.roles.includes(role))
        : [];

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="fixed top-4 left-4 z-50 h-[calc(100vh-2rem)] hidden md:flex flex-col justify-center">
                <motion.nav
                    initial={{ width: 80 }}
                    animate={{ width: isExpanded ? 80 : 56 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`
                        bg-white/90 backdrop-blur-md border border-gray-100
                        rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.05)]
                        py-6
                        no-scrollbar
                        dark:bg-[#171717]/90 dark:border-white/10
                        ${isExpanded ? 'overflow-y-auto' : 'overflow-visible'}
                    `}
                >
                    <div className="w-full flex flex-col items-center gap-2 relative">

                        {/* Arrow Button (TOP) */}
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="
                                mb-3 w-8 h-8
                                flex items-center justify-center
                                rounded-full
                                bg-white dark:bg-[#171717]
                                border border-gray-100 dark:border-white/10
                                shadow-md
                                hover:scale-110
                                transition-transform
                                cursor-pointer                                
                                z-50
                            "
                        >
                            {isExpanded ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                        </button>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center w-full gap-2"
                                >
                                    {/* Navigation */}
                                    <ul className="flex flex-col gap-3 w-full px-3">
                                        {visibleItems.map((item) => {
                                            const isActive = location.pathname === item.path;
                                            const Icon = item.icon;

                                            return (
                                                <li key={item.name} className="relative group">
                                                    <Link
                                                        to={item.path}
                                                        className={`
                                                            relative flex items-center justify-center
                                                            w-14 h-14 rounded-2xl
                                                            transition-all duration-300
                                                            ${isActive
                                                                ? 'text-white bg-primary-400 shadow-lg shadow-primary-400/30'
                                                                : 'text-gray-400 hover:text-white hover:bg-primary-400 dark:text-gray-500'
                                                            }
                                                        `}
                                                    >
                                                        <Icon size={24} strokeWidth={2} />

                                                        {/* Tooltip */}
                                                        <span
                                                            className="
                                                                absolute left-full top-1/2
                                                                -translate-y-1/2 ml-3
                                                                px-3 py-1.5 rounded-xl
                                                                bg-white dark:bg-[#262626]
                                                                border border-gray-100 dark:border-white/10
                                                                shadow-lg
                                                                text-primary-600 dark:text-primary-400
                                                                font-semibold text-sm whitespace-nowrap
                                                                opacity-0 group-hover:opacity-100
                                                                group-hover:translate-x-0 -translate-x-2
                                                                pointer-events-none
                                                                transition-all duration-300
                                                                z-20
                                                            "
                                                        >
                                                            {item.name}
                                                        </span>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    {/* Bottom Actions */}
                                    <div className="mt-auto px-3 pb-2 w-full flex flex-col gap-3">
                                        {!role ? (
                                            <Link to="/login" className="relative group">
                                                <div className="
                                                    flex items-center justify-center
                                                    w-14 h-14 rounded-2xl
                                                    bg-gray-50 text-gray-400
                                                    hover:bg-primary-400 hover:text-white
                                                    transition-all duration-300
                                                    dark:bg-white/5 dark:text-gray-500
                                                ">
                                                    <LogIn size={24} />
                                                </div>

                                                <span className="
                                                    absolute left-full top-1/2
                                                    -translate-y-1/2 ml-3
                                                    px-3 py-1.5 rounded-xl
                                                    bg-white dark:bg-[#262626]
                                                    border border-gray-100 dark:border-white/10
                                                    shadow-lg
                                                    text-primary-600 dark:text-primary-400
                                                    font-semibold text-sm whitespace-nowrap
                                                    opacity-0 group-hover:opacity-100
                                                    group-hover:translate-x-0 -translate-x-2
                                                    pointer-events-none transition-all duration-300
                                                ">
                                                    Sign In
                                                </span>
                                            </Link>
                                        ) : (
                                            <button onClick={handleLogout} className="relative group">
                                                <div className="
                                                    flex items-center justify-center
                                                    w-14 h-14 rounded-2xl
                                                    bg-red-50 text-red-400
                                                    hover:bg-red-500 hover:text-white
                                                    transition-all duration-300
                                                    dark:bg-white/5
                                                ">
                                                    <LogOut size={24} />
                                                </div>

                                                <span className="
                                                    absolute left-full top-1/2
                                                    -translate-y-1/2 ml-3
                                                    px-3 py-1.5 rounded-xl
                                                    bg-white dark:bg-[#262626]
                                                    border border-gray-100 dark:border-white/10
                                                    shadow-lg
                                                    text-red-500
                                                    font-semibold text-sm whitespace-nowrap
                                                    opacity-0 group-hover:opacity-100
                                                    group-hover:translate-x-0 -translate-x-2
                                                    pointer-events-none transition-all duration-300
                                                ">
                                                    Logout
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.nav>

                {/* Mobile Bottom Bar */}
                <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-200 md:hidden z-50 px-6 py-4 flex justify-between items-center dark:bg-[#171717]/90 dark:border-white/10">
                    {visibleItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex flex-col items-center gap-1 ${
                                    isActive ? 'text-primary-400' : 'text-gray-400'
                                }`}
                            >
                                <Icon size={24} />
                                <span className="text-[10px] font-medium">
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default Navbar;
