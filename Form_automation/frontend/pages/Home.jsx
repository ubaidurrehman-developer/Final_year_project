import { motion } from 'framer-motion';
import { ArrowRight, FileText, Users, Zap, CheckCircle2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 lg:pt-32 lg:pb-40">
                <div className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] text-primary-400 text-sm font-medium mb-8 shadow-lg shadow-black/5">
                            <Sparkles className="h-4 w-4 text-[var(--color-warning)]" />
                            <span className="text-[var(--page-text)] opacity-90">Next-Gen University Portal</span>
                        </span>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight font-extrabold text-[var(--page-text)] mb-6 leading-tight">
                            <span className="block">Automate Forms with</span>
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-teal-400 to-emerald-400">
                                Intelligent Agents
                            </span>
                        </h1>

                        <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-[var(--text-muted)] mb-8 sm:mb-10 leading-relaxed px-4 sm:px-0">
                            Streamline your academic workflow. Submit, track, and manage requests effortlessly with our AI-powered multi-agent automation system.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
                            <Link to="/login" className="w-full sm:w-auto group relative inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-bold text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl sm:rounded-2xl overflow-hidden transition-all hover:shadow-lg hover:shadow-primary-500/40 hover:scale-105 active:scale-95 min-h-[48px]">
                                <span className="relative z-10 flex items-center gap-2">
                                    Get Started
                                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Link>
                            <Link to="/about" className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-medium text-[var(--text-muted)] bg-[var(--glass-bg)] backdrop-blur-sm border border-[var(--glass-border)] rounded-xl sm:rounded-2xl hover:bg-[var(--glass-border)] hover:text-[var(--page-text)] transition-all hover:scale-105 active:scale-95 min-h-[48px]">
                                Learn More
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 relative">
                <div className="max-w-[1600px] mx-auto px-6 md:px-12">
                    <div className="text-center mb-16">
                        <h2 className="text-sm text-primary-400 font-bold tracking-widest uppercase mb-3">Features</h2>
                        <p className="text-3xl font-bold text-[var(--page-text)] sm:text-4xl">
                            Everything you need to manage forms
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            {
                                icon: <FileText className="h-6 w-6" />,
                                title: "Easy Submission",
                                desc: "Submit forms quickly with our intuitive interface. No more paper trails or lost documents.",
                                color: "bg-[var(--bg-info)] text-[var(--color-info)] border-[var(--color-info)]/30"
                            },
                            {
                                icon: <Users className="h-6 w-6" />,
                                title: "Multi-Agent System",
                                desc: "Our intelligent agents route your forms to the right people automatically based on content.",
                                color: "bg-teal-500/20 text-teal-400 border-teal-500/30"
                            },
                            {
                                icon: <Zap className="h-6 w-6" />,
                                title: "Real-time Tracking",
                                desc: "Track the status of your forms in real-time. Get notified instantly when status changes.",
                                color: "bg-[var(--bg-warning)] text-[var(--color-warning)] border-[var(--color-warning)]/30"
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="group p-8 bg-[var(--card-bg)] backdrop-blur-md rounded-3xl border border-[var(--glass-border)] hover:bg-[var(--glass-bg)] hover:border-[var(--glass-border)] hover:shadow-2xl hover:shadow-teal-500/10 transition-all duration-300"
                            >
                                <div className={`inline-flex items-center justify-center h-14 w-14 rounded-2xl ${feature.color} border mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-[var(--page-text)] mb-3">{feature.title}</h3>
                                <p className="text-[var(--text-muted)] leading-relaxed">
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
