import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, ArrowLeft, GraduationCap, AlertCircle, Hexagon, Sparkles } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(`${BASE_URL}/login/`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                }),
            });
            const user = await response.json();
            localStorage.setItem('role', user.role);
            user.role === 'student' ? navigate('/student') : navigate('/registration');
        } catch (err) {
            setError('Authentication failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };
    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[var(--page-bg)] transition-colors duration-300">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary-600 rounded-full blur-[120px] opacity-20 animate-blob" style={{ opacity: 'var(--blob-opacity)' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-600 rounded-full blur-[120px] opacity-20 animate-blob animation-delay-2000" style={{ opacity: 'var(--blob-opacity)' }} />
                <div className="absolute top-[40%] left-[40%] w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] opacity-20 animate-blob animation-delay-4000" style={{ opacity: 'var(--blob-opacity)' }} />
            </div>

            {/* Main Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] max-w-5xl mx-4 grid grid-cols-1 lg:grid-cols-2 bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-3xl shadow-2xl overflow-hidden"
            >
                {/* Left Side - Visual (Minimalist Design) */}
                <div className="relative hidden lg:flex flex-col justify-center items-center p-12 overflow-hidden bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
                    <ArrowLeft
                        className="absolute top-8 left-8 h-6 w-6 text-white/70 cursor-pointer hover:text-white transition"
                        onClick={() => navigate('/')}
                    />

                    <div className="flex flex-col items-center text-center">
                        {/* Unique Composite Logo */}
                        <div className="mb-8 relative group cursor-default">
                            {/* Background Glow */}
                            <div className="absolute inset-0 bg-teal-500/30 blur-2xl rounded-full transform group-hover:scale-110 transition-transform duration-700" />

                            <div className="relative flex items-center justify-center">
                                {/* Rotating Outer Hexagon */}
                                <div className="absolute inset-0 animate-spin-slow opacity-80">
                                    <Hexagon className="h-32 w-32 text-teal-500/50" strokeWidth={1} />
                                </div>
                                {/* Static Inner Hexagon */}
                                <Hexagon className="h-32 w-32 text-teal-400 relative z-10 drop-shadow-[0_0_15px_rgba(45,212,191,0.5)] transform -rotate-12 group-hover:rotate-0 transition-transform duration-500" strokeWidth={1.5} />

                                {/* Central Element */}
                                <div className="absolute z-20 transform group-hover:scale-110 transition-transform duration-300">
                                    <GraduationCap className="h-14 w-14 text-white drop-shadow-lg" strokeWidth={1.5} />
                                </div>

                                {/* Orbiting Sparkle */}
                                <div className="absolute -top-2 -right-2 animate-bounce">
                                    <Sparkles className="h-6 w-6 text-yellow-300 drop-shadow-md" fill="currentColor" />
                                </div>
                            </div>
                        </div>

                        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
                            UniPortal
                        </h1>
                        <p className="text-lg text-slate-300/80 font-light">
                            Connect. Access. Succeed.
                        </p>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="relative p-6 sm:p-12 flex flex-col justify-center items-center bg-[var(--glass-bg)] overflow-hidden">
                    {/* Background decorations for the right side to enhance glass effect */}
                    <div className="absolute top-[-20%] right-[-20%] w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[80px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-teal-400/10 rounded-full blur-[60px] pointer-events-none" />

                    {/* Mobile Back Button */}
                    <div className="lg:hidden w-full mb-6">
                        <ArrowLeft
                            className="h-6 w-6 text-[var(--page-text)] cursor-pointer hover:scale-110 transition"
                            onClick={() => navigate('/')}
                        />
                    </div>

                    {/* Inner Glass Card */}
                    <div className="w-full max-w-sm border border-gray-300 text-gray-900 bg-white/40 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-8 relative z-10">
                        <div className="mb-8 text-center">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h3>
                            <p className="text-gray-500 text-sm">Please enter your details</p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 text-xs font-medium flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="Username"
                                        className="w-full bg-white/70 border border-gray-300 text-gray-800 rounded-full px-11 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-gray-400 text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Password"
                                        className="w-full bg-white/70 border border-gray-300 text-gray-800 rounded-full px-11 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-gray-400 text-sm"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end pr-2">
                                    <Link to={'/forgot-password'} className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors">Forgot?</Link>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white font-semibold py-3 rounded-full shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span className="text-sm">Processing...</span>
                                    </>
                                ) : (
                                    <span className="text-sm">Sign In</span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;