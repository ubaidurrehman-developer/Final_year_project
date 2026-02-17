import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { GraduationCap, ArrowRight, Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const LandingNavbar = () => {
    const { scrollY } = useScroll();
    const [isScrolled, setIsScrolled] = useState(false);
    const { toggleTheme } = useTheme();

    useEffect(() => {
        return scrollY.on('change', (latest) => {
            setIsScrolled(latest > 50);
        });
    }, [scrollY]);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <motion.nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'py-4' : 'py-6'}`}
        >
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div
                    className={`
                        mx-auto rounded-full px-6 py-3 flex items-center justify-between
                        transition-all duration-300
                        ${isScrolled
                            ? 'bg-white/80 backdrop-blur-md border border-gray-200 shadow-lg dark:bg-black/80 dark:border-white/10'
                            : 'bg-transparent border-transparent'
                        }
                    `}
                >
                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-2 group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="p-1.5 bg-primary-500 rounded-lg text-white group-hover:scale-105 transition-transform">
                            <GraduationCap size={20} />
                        </div>
                        <span className={`font-bold text-lg tracking-tight ${isScrolled ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>
                            UniPortal
                        </span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8">
                        {['About', 'Features', 'FAQ', 'Contact'].map((item) => (
                            <button
                                key={item}
                                onClick={() => scrollToSection(item.toLowerCase())}
                                className="text-sm font-medium text-gray-600 hover:text-primary-500 transition-colors dark:text-gray-300"
                            >
                                {item}
                            </button>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 transition-colors"
                            aria-label="Toggle Theme"
                        >
                            <Palette size={20} />
                        </button>
                        <Link
                            to="/login"
                            className="px-5 py-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary-500/25 flex items-center gap-2"
                        >
                            Get Started
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
};

export default LandingNavbar;
