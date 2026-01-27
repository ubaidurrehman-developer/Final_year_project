import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, GraduationCap, Sun, Moon, Twitter, Linkedin, Facebook, Instagram, Mail, ArrowRight, Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="relative z-10 border-t border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl pt-16 pb-8 mt-20">
            <div className="max-w-[1600px] mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="p-2 bg-gradient-to-br from-primary-500 to-teal-600 rounded-lg shadow-lg">
                                <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--page-text)] to-[var(--text-muted)]">
                                UniPortal
                            </span>
                        </Link>
                        <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                            Empowering educational institutions with next-generation AI automation. Streamline workflows, enhance productivity, and focus on what matters most.
                        </p>
                        <div className="flex gap-4">
                            {[Twitter, Linkedin, Facebook, Instagram].map((Icon, i) => (
                                <a key={i} href="#" className="w-9 h-9 flex items-center justify-center bg-[var(--glass-border)] text-[var(--text-muted)] border border-gray-400 rounded-full hover:text-[var(--page-text)] transition">
                                    <Icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className='ml-25'>
                        <h3 className="text-[var(--page-text)] font-bold mb-6 mt-3 ml-3">Platform</h3>
                        <ul className="space-y-3">
                            {['Student Portal', 'Admin Dashboard', 'Agent Monitor', 'Template Manager'].map((item) => (
                                <li key={item}>
                                    <a href="#" className="text-[var(--text-muted)] hover:text-primary-400 transition-colors text-sm flex items-center gap-2 group">
                                        <span className="w-1 h-1 rounded-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className='ml-15'>
                        <h3 className="text-[var(--page-text)] font-bold mb-6 mt-3 ml-3">Resources</h3>
                        <ul className="space-y-3">
                            {['Documentation', 'API Reference', 'Community', 'Help Center'].map((item) => (
                                <li key={item}>
                                    <a href="#" className="text-[var(--text-muted)] hover:text-primary-400 transition-colors text-sm flex items-center gap-2 group">
                                        <span className="w-1 h-1 rounded-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="text-lg text-[var(--page-text)] font-bold mb-6">Stay Updated</h3>
                        <p className="text-[var(--text-muted)] text-sm mb-4">
                            Subscribe to our newsletter for the latest updates and features.
                        </p>
                        <div className="space-y-3">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full bg-[var(--card-bg)] border border-gray-300 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[var(--page-text)] placeholder:text-[var(--text-muted)] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                                />
                            </div>
                            <Link to='/login' className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 group cursor-pointer">
                                Subscribe
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-[var(--glass-border)] flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                        <span>© 2026 UniPortal. Made with</span>
                        <Heart className="h-4 w-4 text-red-500 fill-red-500 animate-pulse" />
                        <span>for Education.</span>
                    </div>
                    <div className="flex gap-8 text-sm text-[var(--text-muted)]">
                        <a href="#" className="hover:text-[var(--page-text)] transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-[var(--page-text)] transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-[var(--page-text)] transition-colors">Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer;