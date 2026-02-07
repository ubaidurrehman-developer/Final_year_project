import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Twitter, Linkedin, Facebook, Instagram, Mail, ArrowRight, Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="relative z-10 bg-[#0a0a0a] text-white pt-24 pb-12 overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl pointer-events-none translate-y-1/2" />

            <div className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">
                    {/* Brand Column */}
                    <div className="lg:col-span-4 space-y-8">
                        <Link to="/" className="flex items-center gap-3 group w-fit">
                            <div className="p-2.5 bg-primary-500 rounded-xl shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform duration-300">
                                <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-white">
                                UniPortal
                            </span>
                        </Link>
                        <p className="text-gray-400 text-base leading-relaxed max-w-sm">
                            Empowering educational institutions with next-generation AI automation. Streamline workflows, enhance productivity, and focus on what matters most.
                        </p>
                        <div className="flex gap-4">
                            {[Twitter, Linkedin, Facebook, Instagram].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-full hover:bg-primary-500 hover:border-primary-500 hover:text-white text-gray-400 transition-all duration-300 group">
                                    <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div className="lg:col-span-2 lg:col-start-6">
                        <h3 className="text-white font-bold mb-6 text-lg">Platform</h3>
                        <ul className="space-y-4">
                            {['Student Portal', 'Admin Dashboard', 'Agent Monitor', 'Template Manager'].map((item) => (
                                <li key={item}>
                                    <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors text-sm font-medium">
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-2">
                        <h3 className="text-white font-bold mb-6 text-lg">Resources</h3>
                        <ul className="space-y-4">
                            {['Documentation', 'API Reference', 'Community', 'Help Center'].map((item) => (
                                <li key={item}>
                                    <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors text-sm font-medium">
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter - Prominent */}
                    <div className="lg:col-span-3">
                        <h3 className="text-lg text-white font-bold mb-6">Stay Updated</h3>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                            <p className="text-gray-400 text-sm mb-4">
                                Subscribe to our newsletter for the latest updates and AI features.
                            </p>
                            <div className="space-y-3">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                                    />
                                </div>
                                <button className="w-full bg-primary-500 hover:bg-primary-400 text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 group cursor-pointer hover:-translate-y-0.5">
                                    Subscribe
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>© 2026 UniPortal. Made with</span>
                        <Heart className="h-4 w-4 text-red-500 fill-red-500 animate-pulse" />
                        <span>for Education.</span>
                    </div>
                    <div className="flex gap-8 text-sm text-gray-500 font-medium">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer;