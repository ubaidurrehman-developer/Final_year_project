import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, GraduationCap, ShieldCheck, LogIn, LogOut, Sun, Moon, Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme, accentColor, setAccentColor, colorPalettes } = useTheme();
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const paletteRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {

        const handleClickOutside = (event) => {
            if (isPaletteOpen &&
                paletteRef.current &&
                !paletteRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)) {
                setIsPaletteOpen(false);
            }
        };


        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isPaletteOpen]);

    const role = localStorage.getItem('role');
    const isLoggedIn = !!role;

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const navItems = [
        { name: 'Home', path: '/', icon: Home, roles: ['admin', 'student'] },
        { name: 'Student', path: '/student', icon: GraduationCap, roles: ['student'] },
        { name: 'Admin', path: '/admin', icon: ShieldCheck, roles: ['admin'] },
    ];

    const visibleItems = role ? navItems.filter((item) => item.roles.includes(role)) : [];

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-16 md:top-1/2 md:-translate-y-1/2 md:bottom-auto z-50 w-max">
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex flex-row md:flex-col items-center gap-1.5 sm:gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-xl sm:rounded-2xl bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-2xl shadow-black/20"
            >
                {visibleItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                        <Link key={item.name} to={item.path} className="relative group">
                            <motion.div
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 ${isActive
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                    : 'text-[var(--text-muted)] hover:text-[var(--page-text)] hover:bg-[var(--glass-border)]'
                                    }`}
                            >
                                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="hidden md:block absolute left-full ml-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none backdrop-blur-md">
                                    {item.name}
                                </span>
                            </motion.div>
                        </Link>
                    );
                })}

                <div className="w-px h-8 md:h-px md:w-8 bg-[var(--glass-border)] mx-1" />

                {/* Theme & Accent */}
                <div className="relative">
                    <motion.button
                        ref={buttonRef}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsPaletteOpen(!isPaletteOpen)}
                        className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all relative group ${isPaletteOpen ? 'bg-[var(--glass-border)] text-[var(--page-text)]' : 'text-[var(--text-muted)] hover:text-[var(--page-text)] hover:bg-[var(--glass-border)]'}`}
                    >
                        <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden md:block absolute left-full ml-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none backdrop-blur-md">
                            Customize
                        </span>
                    </motion.button>

                    <AnimatePresence>
                        {isPaletteOpen && (
                            <motion.div
                                ref={paletteRef}
                                initial={{ opacity: 0, x: 10, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 10, scale: 0.95 }}
                                className="absolute bottom-full left-0 mb-4 md:left-full md:bottom-auto md:top-0 md:ml-4 p-3 bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-xl sm:rounded-2xl shadow-2xl flex flex-col gap-3 min-w-[130px] sm:min-w-[150px]"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Theme</span>
                                    <button
                                        onClick={toggleTheme}
                                        className="p-1.5 rounded-lg bg-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors"
                                    >
                                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="h-px bg-[var(--glass-border)]" />
                                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Accent</span>
                                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                                    {Object.keys(colorPalettes).map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setAccentColor(color)}
                                            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-all ${accentColor === color
                                                ? 'border-[var(--page-text)] scale-110'
                                                : 'border-transparent hover:scale-110'
                                                }`}
                                            style={{ backgroundColor: colorPalettes[color][500] }}
                                            title={color.charAt(0).toUpperCase() + color.slice(1)}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Login Button */}
                {!isLoggedIn ? (
                    <Link to="/login" className="relative group">
                        <motion.div
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 ${location.pathname === '/login'
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                    : 'text-[var(--text-muted)] hover:text-[var(--page-text)] hover:bg-[var(--glass-border)]'
                                }`}
                        >
                            <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="tooltip">Sign In</span>
                        </motion.div>
                    </Link>
                ) : (
                    <button onClick={handleLogout} className="relative group">
                        <motion.div
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 text-red-400 hover:bg-red-500/10"
                        >
                            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="tooltip">Logout</span>
                        </motion.div>
                    </button>
                )}

            </motion.div>
        </div>
    );
};

export default Navbar;
