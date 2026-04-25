import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import {
    PanelLeftClose,
    PanelLeftOpen,
    GraduationCap,
    LogIn,
    LogOut,
    UserPlus,
    CircleUser,
    Workflow,
    ScanLine,
    Menu,
    X,
    Plus,
    LayoutDashboard
} from 'lucide-react';
import { api } from '../src/index';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [isExpanded, setIsExpanded] = useState(false);
    const [role, setRole] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Fetch role from backend on mount + on every route change
    useEffect(() => {
        const fetchRole = async () => {
            try {
                const res = await api.get('/me/', { withCredentials: true });
                setRole(res.data.role);
            } catch {
                setRole(null);
            }
        };
        fetchRole();
    }, []);

    const handleLogout = async () => {
        try {
            await api.post('/logout/', {}, { withCredentials: true });
        } catch (error) {
            console.log(error);
        }
        setRole(null);
        setMobileOpen(false);
        navigate('/');
    };

    const navItems = [
        { name: 'Profile', path: '/profile', icon: CircleUser, roles: ['admin', 'student'] },
        { name: 'Registration', path: '/admin/registration', icon: UserPlus, roles: ['admin'] },
        { name: 'Dashboard', path: '/student/dashboard', icon: GraduationCap, roles: ['student'] },
        { name: 'Workflow', path: '/admin/workflow', icon: Workflow, roles: ['admin'] },
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['admin'] },
        { name: 'Select Form', path: '/student/forms', icon: Plus, roles:['student']},
        { name: 'Detection', path: '/detection', icon: ScanLine, roles: ['admin'] },
    ];

    const visibleItems = role
        ? navItems.filter((item) => item.roles.includes(role))
        : [];

    // Sidebar widths
    const collapsedW = 72;
    const expandedW = 240;

    return (
        <>
            {/* ─── Desktop Sidebar ─── */}
            <motion.aside
                initial={false}
                animate={{ width: isExpanded ? expandedW : collapsedW }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="
                    fixed top-0 left-0 z-50
                    h-screen
                    hidden md:flex flex-col
                    bg-white/90 backdrop-blur-xl
                    border-r border-gray-200/60
                    shadow-[4px_0_24px_rgba(0,0,0,0.04)]
                    dark:bg-[#111111]/95 dark:border-white/[0.06]
                    overflow-hidden
                "
            >
                {/* ── Header / Toggle ── */}
                <div className="flex items-center h-16 px-4 shrink-0">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="
                            w-10 h-10 rounded-xl
                            flex items-center justify-center
                            text-gray-500 dark:text-gray-400
                            hover:bg-gray-100 dark:hover:bg-white/[0.06]
                            hover:text-primary-500
                            transition-all duration-200
                            cursor-pointer
                        "
                        aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                    >
                        {isExpanded
                            ? <PanelLeftClose size={20} strokeWidth={1.8} />
                            : <PanelLeftOpen size={20} strokeWidth={1.8} />
                        }
                    </button>

                    <AnimatePresence>
                        {isExpanded && (
                            <motion.span
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.15 }}
                                className="ml-3 text-sm font-bold tracking-tight text-primary-600 dark:text-primary-400 whitespace-nowrap"
                            >
                                Formulate
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Separator ── */}
                <div className="mx-3 border-t border-gray-200/60 dark:border-white/[0.06]" />

                {/* ── Nav Items ── */}
                <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto no-scrollbar">
                    {visibleItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`
                                    group relative flex items-center
                                    h-11 rounded-xl
                                    transition-all duration-200
                                    ${isExpanded ? 'px-3 gap-3' : 'justify-center'}
                                    ${isActive
                                        ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-200'
                                    }
                                `}
                            >
                                <Icon size={20} strokeWidth={1.8} className="shrink-0" />

                                {/* Label — only when expanded */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.span
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 'auto' }}
                                            exit={{ opacity: 0, width: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="text-sm font-medium whitespace-nowrap overflow-hidden"
                                        >
                                            {item.name}
                                        </motion.span>
                                    )}
                                </AnimatePresence>

                                {/* Tooltip — only when collapsed */}
                                {!isExpanded && (
                                    <span className="
                                        absolute left-full top-1/2 -translate-y-1/2 ml-3
                                        px-3 py-1.5 rounded-lg
                                        bg-gray-900 dark:bg-gray-100
                                        text-white dark:text-gray-900
                                        text-xs font-medium whitespace-nowrap
                                        opacity-0 group-hover:opacity-100
                                        scale-95 group-hover:scale-100
                                        pointer-events-none
                                        transition-all duration-200
                                        shadow-lg
                                        z-[60]
                                    ">
                                        {item.name}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* ── Bottom Actions ── */}
                <div className="px-3 pb-4 shrink-0">
                    <div className="border-t border-gray-200/60 dark:border-white/[0.06] pt-3">
                        {!role ? (
                            <Link
                                to="/login"
                                className={`
                                    group relative flex items-center
                                    h-11 rounded-xl
                                    text-gray-500 dark:text-gray-400
                                    hover:bg-primary-50 hover:text-primary-600
                                    dark:hover:bg-primary-500/10 dark:hover:text-primary-400
                                    transition-all duration-200
                                    ${isExpanded ? 'px-3 gap-3' : 'justify-center'}
                                `}
                            >
                                <LogIn size={20} strokeWidth={1.8} className="shrink-0" />
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.span
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 'auto' }}
                                            exit={{ opacity: 0, width: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="text-sm font-medium whitespace-nowrap overflow-hidden"
                                        >
                                            Sign In
                                        </motion.span>
                                    )}
                                </AnimatePresence>

                                {!isExpanded && (
                                    <span className="
                                        absolute left-full top-1/2 -translate-y-1/2 ml-3
                                        px-3 py-1.5 rounded-lg
                                        bg-gray-900 dark:bg-gray-100
                                        text-white dark:text-gray-900
                                        text-xs font-medium whitespace-nowrap
                                        opacity-0 group-hover:opacity-100
                                        scale-95 group-hover:scale-100
                                        pointer-events-none transition-all duration-200 shadow-lg z-[60]
                                    ">
                                        Sign In
                                    </span>
                                )}
                            </Link>
                        ) : (
                            <button
                                onClick={handleLogout}
                                className={`
                                    group relative flex items-center w-full
                                    h-11 rounded-xl
                                    text-red-400
                                    hover:bg-red-50 hover:text-red-600
                                    dark:hover:bg-red-500/10 dark:hover:text-red-400
                                    transition-all duration-200
                                    cursor-pointer
                                    ${isExpanded ? 'px-3 gap-3' : 'justify-center'}
                                `}
                            >
                                <LogOut size={20} strokeWidth={1.8} className="shrink-0" />
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.span
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 'auto' }}
                                            exit={{ opacity: 0, width: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="text-sm font-medium whitespace-nowrap overflow-hidden"
                                        >
                                            Logout
                                        </motion.span>
                                    )}
                                </AnimatePresence>

                                {!isExpanded && (
                                    <span className="
                                        absolute left-full top-1/2 -translate-y-1/2 ml-3
                                        px-3 py-1.5 rounded-lg
                                        bg-red-600 text-white
                                        text-xs font-medium whitespace-nowrap
                                        opacity-0 group-hover:opacity-100
                                        scale-95 group-hover:scale-100
                                        pointer-events-none transition-all duration-200 shadow-lg z-[60]
                                    ">
                                        Logout
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </motion.aside>

            {/* ─── Mobile Bottom Bar ─── */}
            <div className="fixed bottom-0 left-0 w-full md:hidden z-50">
                <div className="
                    bg-white/90 backdrop-blur-xl
                    border-t border-gray-200/60
                    dark:bg-[#111111]/95 dark:border-white/[0.06]
                    px-2 py-2
                    flex justify-around items-center
                    shadow-[0_-4px_24px_rgba(0,0,0,0.04)]
                ">
                    {visibleItems.slice(0, 4).map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`
                                    flex flex-col items-center gap-0.5
                                    px-3 py-1.5 rounded-xl
                                    transition-all duration-200
                                    ${isActive
                                        ? 'text-primary-500'
                                        : 'text-gray-400 dark:text-gray-500'
                                    }
                                `}
                            >
                                <Icon size={20} strokeWidth={1.8} />
                                <span className="text-[10px] font-medium">{item.name}</span>
                            </Link>
                        );
                    })}

                    {/* More button for overflow items */}
                    {visibleItems.length > 4 && (
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-gray-400 cursor-pointer"
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                            <span className="text-[10px] font-medium">More</span>
                        </button>
                    )}

                    {/* Logout in mobile (if no overflow) */}
                    {role && visibleItems.length <= 4 && (
                        <button
                            onClick={handleLogout}
                            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-red-400 cursor-pointer"
                        >
                            <LogOut size={20} strokeWidth={1.8} />
                            <span className="text-[10px] font-medium">Logout</span>
                        </button>
                    )}
                </div>

                {/* Mobile overflow sheet */}
                <AnimatePresence>
                    {mobileOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="
                                absolute bottom-full left-0 right-0
                                mb-2 mx-4
                                bg-white/95 dark:bg-[#171717]/95
                                backdrop-blur-xl
                                border border-gray-200/60 dark:border-white/[0.06]
                                rounded-2xl shadow-2xl
                                p-4
                            "
                        >
                            {visibleItems.slice(4).map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.path}
                                        onClick={() => setMobileOpen(false)}
                                        className={`
                                            flex items-center gap-3 px-3 py-2.5 rounded-xl
                                            transition-all duration-200
                                            ${isActive
                                                ? 'bg-primary-500 text-white'
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]'
                                            }
                                        `}
                                    >
                                        <Icon size={18} strokeWidth={1.8} />
                                        <span className="text-sm font-medium">{item.name}</span>
                                    </Link>
                                );
                            })}

                            {role && (
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 w-full mt-1 transition-all cursor-pointer"
                                >
                                    <LogOut size={18} strokeWidth={1.8} />
                                    <span className="text-sm font-medium">Logout</span>
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

export default Navbar;
