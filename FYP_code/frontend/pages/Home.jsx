import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, CheckSquare, PieChart, Columns, Share2, Clock, Smartphone, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const SecurityIcon = () => <ShieldCheck size={24} />;

const Home = () => {
    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section id="home" className="relative min-h-[90vh] flex items-center justify-center pt-32 pb-20 overflow-hidden">
                {/* Background Glows for "Clean" look */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-100/50 rounded-full blur-[120px] -z-10" />

                <div className="relative mt-15 z-10 max-w-5xl mx-auto px-6 md:px-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        {/* Badge */}
                        <div className="flex justify-center mb-10">
                            <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white border border-gray-100 text-gray-700 text-sm font-semibold shadow-lg shadow-gray-200/50">
                                <Sparkles className="h-4 w-4 text-amber-400 fill-amber-400" />
                                <span>Next-Gen University Portal</span>
                            </span>
                        </div>

                        {/* Heading */}
                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-7.5xl tracking-tight font-extrabold text-[#0a0a0a] mb-8 leading-[1.1]">
                            Automate Forms with <br className="hidden sm:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0ea5e9] to-[#22d3d3]">
                                Intelligent Agents
                            </span>
                        </h1>

                        {/* Subtext */}
                        <p className="mt-8 max-w-3xl mx-auto text-xl sm:text-lg text-gray-500 mb-12 leading-relaxed font-medium">
                            Streamline your academic workflow. Submit, track, and manage requests effortlessly with our AI-powered multi-agent automation system.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Why Choose TaskEase Section */}
            <section id="features" className="py-24 relative overflow-hidden scroll-mt-20">
                <div className="max-w-[1600px] mx-auto px-6 md:px-12">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-extrabold text-[var(--page-text)] mb-6 tracking-tight"
                        >
                            Why Choose TaskEase?
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-lg md:text-xl text-[var(--text-muted)]"
                        >
                            Discover the key features that make TaskEase the perfect tool for managing your tasks efficiently.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <CheckSquare className="h-8 w-8" />,
                                title: "Task Management",
                                desc: "Efficiently organize, prioritize, and manage all your tasks."
                            },
                            {
                                icon: <PieChart className="h-8 w-8" />,
                                title: "Analytics & Reporting",
                                desc: "Gain insights with detailed analytics and comprehensive reports."
                            },
                            {
                                icon: <Columns className="h-8 w-8" />,
                                title: "Customizable Workflows",
                                desc: "Tailor workflows to fit your specific project needs and preferences."
                            },
                            {
                                icon: <Share2 className="h-8 w-8" />,
                                title: "Shared Tasks",
                                desc: "Work with your team by assigning multiple people to the same task."
                            },
                            {
                                icon: <Clock className="h-8 w-8" />,
                                title: "Deadlines & Reminders",
                                desc: "Never miss important deadlines with timely reminders."
                            },
                            {
                                icon: <Smartphone className="h-8 w-8" />,
                                title: "Mobile Accessibility",
                                desc: "Manage tasks on-the-go with our mobile-friendly platform."
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="group p-8 md:p-10 bg-white rounded-[2rem] border border-gray-100 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-500 hover:-translate-y-1 dark:bg-[#171717] dark:border-white/5 dark:hover:border-primary-500/20"
                            >
                                <div className="mb-6 text-gray-900 group-hover:text-primary-500 transition-colors duration-300 dark:text-white">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-[var(--page-text)] mb-3 group-hover:text-primary-500 transition-colors">{feature.title}</h3>
                                <p className="text-[var(--text-muted)] leading-relaxed text-[15px]">
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-24 bg-gray-50 dark:bg-white/5 scroll-mt-20">
                <div className="max-w-4xl mx-auto px-6 md:px-12">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-extrabold text-[var(--page-text)] mb-6">Frequently Asked Questions</h2>
                        <p className="text-lg text-[var(--text-muted)]">Everything you need to know about the platform.</p>
                    </div>

                    <div className="space-y-4">
                        {[
                            { q: "Is there a free trial available?", a: "Yes, we offer a 14-day free trial for all new users to explore our premium features." },
                            { q: "Can I manage multiple teams?", a: "Absolutely! Our platform supports multi-team management with granular permission controls." },
                            { q: "How secure is my data?", a: "We use enterprise-grade encryption and comply with all major privacy regulations to keep your data safe." },
                            { q: "Do you offer API access?", a: "Yes, our REST API is available on Pro and Enterprise plans for custom integrations." }
                        ].map((item, i) => (
                            <motion.details
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group bg-white dark:bg-[#171717] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden open:shadow-lg open:border-primary-100 transition-all duration-300"
                            >
                                <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-bold text-lg text-[var(--page-text)]">
                                    {item.q}
                                    <span className="text-primary-500 transition-transform group-open:rotate-180">
                                        <ArrowRight className="rotate-90" />
                                    </span>
                                </summary>
                                <div className="px-6 pb-6 text-[var(--text-muted)] leading-relaxed">
                                    {item.a}
                                </div>
                            </motion.details>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA / Contact Section */}
            <section id="contact" className="py-24 relative overflow-hidden">
                <div className="max-w-5xl mx-auto px-6 md:px-12 relative z-10 text-center">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-br from-primary-900 via-teal-900 to-black rounded-[3rem] p-12 md:p-20 text-white shadow-2xl shadow-primary-500/20 relative overflow-hidden"
                    >
                        {/* Decorative blobs */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500 rounded-full blur-[100px] opacity-20" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500 rounded-full blur-[100px] opacity-20" />

                        <h2 className="text-4xl md:text-5xl font-bold mb-6 relative z-10">Ready to boost your productivity?</h2>
                        <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto relative z-10">
                            Join thousands of teams using UniPortal to streamline their academic workflows today.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                            <Link to="/registration" className="px-8 py-4 bg-white text-black rounded-xl font-bold hover:bg-gray-100 transition-all hover:scale-105 shadow-lg">
                                Get Started Now
                            </Link>
                            <Link to="/contact" className="px-8 py-4 bg-transparent border border-white/20 text-white rounded-xl font-bold hover:bg-white/10 transition-all">
                                Contact Sales
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* About Section - Moved to bottom */}
            <section id="about" className="py-32 bg-gray-50 dark:bg-white/5 scroll-mt-20 border-t border-gray-200 dark:border-white/10">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--page-text)] mb-6">About UniPortal</h2>
                            <p className="text-lg text-[var(--text-muted)] mb-6 leading-relaxed">
                                UniPortal is designed to revolutionize how universities handle administrative tasks. By leveraging the power of <strong>Autonomous AI Agents</strong>, we eliminate the bottleneck of manual form processing.
                            </p>
                            <p className="text-lg text-[var(--text-muted)] leading-relaxed">
                                Whether you're a student submitting a leave request or an administrator approving course changes, our intelligent system ensures valid requests are processed instantly, 24/7.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 to-teal-500/20 rounded-3xl blur-3xl" />
                            <div className="relative bg-white dark:bg-[#171717] border border-gray-100 dark:border-white/10 rounded-3xl p-8 shadow-2xl">
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-primary-100 text-primary-600 rounded-xl">
                                            <Sparkles size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-[var(--page-text)]">AI-Driven</h3>
                                            <p className="text-[var(--text-muted)]">Agents analyze and route requests automatically.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-teal-100 text-teal-600 rounded-xl">
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-[var(--page-text)]">Real-Time</h3>
                                            <p className="text-[var(--text-muted)]">Instant status updates and notifications.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                            <SecurityIcon />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-[var(--page-text)]">Secure</h3>
                                            <p className="text-[var(--text-muted)]">Role-based access and encrypted data.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
