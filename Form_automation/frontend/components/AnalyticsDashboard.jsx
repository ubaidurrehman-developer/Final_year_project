import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, FileText, Clock, ArrowUp, ArrowDown } from 'lucide-react';

const AnalyticsDashboard = () => {
    const stats = [
        { title: 'Total Forms', value: '1,234', change: '+12%', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { title: 'Active Students', value: '856', change: '+5%', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { title: 'Pending Reviews', value: '42', change: '-8%', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { title: 'Avg. Processing', value: '1.2 Days', change: '-15%', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
    ];

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--glass-border)] hover:border-primary-500/30 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-lg ${stat.change.startsWith('+') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                {stat.change.startsWith('+') ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-[var(--text-muted)] text-sm font-medium mb-1">{stat.title}</h3>
                        <p className="text-2xl font-bold text-[var(--page-text)]">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Monthly Activity Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--glass-border)]"
                >
                    <h3 className="text-lg font-bold text-[var(--page-text)] mb-6">Monthly Activity</h3>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((height, i) => (
                            <div key={i} className="w-full flex flex-col justify-end group relative">
                                <div
                                    className="w-full bg-primary-500/20 rounded-t-lg hover:bg-primary-500 transition-all duration-300 relative"
                                    style={{ height: `${height}%` }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--card-bg)] border border-[var(--glass-border)] px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        {height} Forms
                                    </div>
                                </div>
                                <span className="text-xs text-[var(--text-muted)] text-center mt-2">
                                    {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Form Distribution */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--glass-border)]"
                >
                    <h3 className="text-lg font-bold text-[var(--page-text)] mb-6">Form Distribution</h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Leave Applications', value: 45, color: 'bg-blue-500' },
                            { label: 'Scholarship Requests', value: 30, color: 'bg-purple-500' },
                            { label: 'Exam Registrations', value: 15, color: 'bg-teal-500' },
                            { label: 'Other Requests', value: 10, color: 'bg-orange-500' },
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-[var(--page-text)]">{item.label}</span>
                                    <span className="text-[var(--text-muted)]">{item.value}%</span>
                                </div>
                                <div className="h-2 bg-[var(--glass-border)] rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.value}%` }}
                                        transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                        className={`h-full ${item.color}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
