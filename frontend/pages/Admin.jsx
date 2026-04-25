import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAlert } from '../context/AlertContext';
import { api } from '../src/index';
import {
    Users, GraduationCap, BookOpen, ClipboardList,
    TrendingUp, Clock, ArrowRight, ScanLine,
    UserPlus, Workflow, AlertCircle, CheckCircle2,
    XCircle, Loader2, Shield, ChevronRight,
} from 'lucide-react';

// Program labels
const PROGRAM_LABELS = { CS: 'Computer Science', SE: 'Software Eng.', AI: 'Artificial Intelligence', CE: 'Computer Eng.' };
const PROGRAM_COLORS = { CS: '#6366f1', SE: '#0ea5e9', AI: '#f59e0b', CE: '#10b981' };
const STATUS_COLORS = { Active: '#10b981', Graduated: '#6366f1', Suspended: '#ef4444' };
const CAMPUS_LABELS = { P: 'Peshawar', F: 'Faisalabad', L: 'Lahore', I: 'Islamabad', K: 'Karachi', M: 'Multan' };

// Animated counter
function AnimatedNumber({ value, duration = 1200 }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        if (!value) { setDisplay(0); return; }
        let start = 0;
        const step = Math.ceil(value / (duration / 16));
        const timer = setInterval(() => {
            start += step;
            if (start >= value) { setDisplay(value); clearInterval(timer); }
            else setDisplay(start);
        }, 16);
        return () => clearInterval(timer);
    }, [value, duration]);
    return <span>{display.toLocaleString()}</span>;
}

// Mini bar chart
function BarChart({ data, colors, labels }) {
    const max = Math.max(...Object.values(data), 1);
    const entries = Object.entries(data);
    if (entries.length === 0) return <p className="text-sm text-gray-400 italic">No data yet</p>;

    return (
        <div className="space-y-3">
            {entries.map(([key, val]) => (
                <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">{labels?.[key] || key}</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{val}</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(val / max) * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: colors?.[key] || '#6366f1' }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function Admin() {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Inactivity auto-logout
    useEffect(() => {
        let timer;
        const logout = async () => {
            showAlert({ message: "Logged out due to inactivity.", type: "warning", duration: 10000 });
            await api.post('/logout/', {}, { withCredentials: true });
            navigate("/login");
        };
        const resetTimer = () => { clearTimeout(timer); timer = setTimeout(logout, 5 * 60 * 1000); };
        const events = ['click', 'mousemove', 'keydown', 'scroll'];
        events.forEach(e => window.addEventListener(e, resetTimer));
        resetTimer();
        return () => { events.forEach(e => window.removeEventListener(e, resetTimer)); clearTimeout(timer); };
    }, []);

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await api.get('/dashboard/', { withCredentials: true });
                setData(res.data);
            } catch (err) {
                console.error('Dashboard fetch failed', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    const c = data?.counts || {};
    const fadeUp = (delay = 0) => ({
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, delay },
    });

    const statCards = [
        { label: 'Total Students', value: c.total_students, icon: GraduationCap, color: 'from-indigo-500 to-purple-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
        { label: 'Active Students', value: c.active_students, icon: ClipboardList, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
        { label: 'Pending Requests', value: c.pending_requests, icon: Clock, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
        { label: 'Total Courses', value: c.total_courses, icon: BookOpen, color: 'from-sky-500 to-blue-600', bg: 'bg-sky-50 dark:bg-sky-500/10' },
    ];

    const quickActions = [
        { label: 'Form Detection', path: '/detection', icon: ScanLine, desc: 'Scan & digitize forms' },
        { label: 'Register User', path: '/admin/registration', icon: UserPlus, desc: 'Add new student or admin' },
        { label: 'Workflow', path: '/admin/workflow', icon: Workflow, desc: 'Manage processing pipeline' },
    ];

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <motion.div {...fadeUp(0)} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Dashboard
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {data?.current_semester
                                ? `${data.current_semester.name} semester in progress`
                                : 'Welcome back, admin'
                            }
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] rounded-xl px-4 py-2.5">
                        <Users size={16} />
                        <span><strong className="text-gray-800 dark:text-white">{c.total_users}</strong> total system users</span>
                        <span className="text-gray-300 dark:text-gray-600 mx-1">·</span>
                        <Shield size={14} />
                        <span><strong className="text-gray-800 dark:text-white">{c.total_admins}</strong> admins</span>
                    </div>
                </motion.div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((card, i) => {
                        const Icon = card.icon;
                        return (
                            <motion.div
                                key={card.label}
                                {...fadeUp(0.05 * (i + 1))}
                                className="group relative bg-white dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/[0.06] rounded-2xl p-5 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-none transition-all duration-300 overflow-hidden"
                            >
                                {/* Gradient accent */}
                                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color} opacity-80`} />

                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{card.label}</p>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                            <AnimatedNumber value={card.value || 0} />
                                        </p>
                                    </div>
                                    <div className={`${card.bg} p-2.5 rounded-xl`}>
                                        <Icon size={22} className="text-gray-600 dark:text-gray-300" strokeWidth={1.8} />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Charts + Actions Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Students by Program */}
                    <motion.div
                        {...fadeUp(0.25)}
                        className="bg-white dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/[0.06] rounded-2xl p-6"
                    >
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <TrendingUp size={16} className="text-indigo-500" />
                            Students by Program
                        </h3>
                        <BarChart
                            data={data?.students_by_program || {}}
                            colors={PROGRAM_COLORS}
                            labels={PROGRAM_LABELS}
                        />
                    </motion.div>

                    {/* Students by Status */}
                    <motion.div
                        {...fadeUp(0.3)}
                        className="bg-white dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/[0.06] rounded-2xl p-6"
                    >
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <GraduationCap size={16} className="text-emerald-500" />
                            Students by Status
                        </h3>
                        <BarChart
                            data={data?.students_by_status || {}}
                            colors={STATUS_COLORS}
                        />

                        {/* Campus breakdown below */}
                        {Object.keys(data?.students_by_campus || {}).length > 0 && (
                            <>
                                <div className="border-t border-gray-100 dark:border-white/[0.06] my-4" />
                                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">By Campus</h4>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(data.students_by_campus).map(([key, val]) => (
                                        <span key={key} className="text-xs bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg font-medium">
                                            {CAMPUS_LABELS[key] || key}: <strong>{val}</strong>
                                        </span>
                                    ))}
                                </div>
                            </>
                        )}
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        {...fadeUp(0.35)}
                        className="bg-white dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/[0.06] rounded-2xl p-6"
                    >
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            {quickActions.map((action) => {
                                const Icon = action.icon;
                                return (
                                    <Link
                                        key={action.label}
                                        to={action.path}
                                        className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-white/[0.04] hover:border-primary-200 dark:hover:border-primary-500/20 hover:bg-primary-50/50 dark:hover:bg-primary-500/5 transition-all duration-200"
                                    >
                                        <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400">
                                            <Icon size={18} strokeWidth={1.8} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{action.label}</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">{action.desc}</p>
                                        </div>
                                        <ArrowRight size={16} className="text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Request summary */}
                        <div className="border-t border-gray-100 dark:border-white/[0.06] mt-4 pt-4">
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Requests Overview</h4>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl py-2.5 px-2">
                                    <Clock size={14} className="text-amber-500 mx-auto mb-1" />
                                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{c.pending_requests}</p>
                                    <p className="text-[10px] text-amber-500/80 font-medium">Pending</p>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl py-2.5 px-2">
                                    <CheckCircle2 size={14} className="text-emerald-500 mx-auto mb-1" />
                                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{c.approved_requests}</p>
                                    <p className="text-[10px] text-emerald-500/80 font-medium">Approved</p>
                                </div>
                                <div className="bg-red-50 dark:bg-red-500/10 rounded-xl py-2.5 px-2">
                                    <XCircle size={14} className="text-red-500 mx-auto mb-1" />
                                    <p className="text-lg font-bold text-red-600 dark:text-red-400">{c.rejected_requests}</p>
                                    <p className="text-[10px] text-red-500/80 font-medium">Rejected</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Row — Pending Requests + Recent Users */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Pending Academic Requests */}
                    <motion.div
                        {...fadeUp(0.4)}
                        className="bg-white dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/[0.06] rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <AlertCircle size={16} className="text-amber-500" />
                                Pending Requests
                            </h3>
                            {(data?.pending_list?.length || 0) > 0 && (
                                <span className="text-xs bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full font-semibold">
                                    {c.pending_requests} pending
                                </span>
                            )}
                        </div>

                        {(!data?.pending_list || data.pending_list.length === 0) ? (
                            <div className="text-center py-8">
                                <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">All caught up! No pending requests.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {data.pending_list.map((req) => (
                                    <div
                                        key={req.id}
                                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04]"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`p-1.5 rounded-lg ${req.type === 'Withdraw' ? 'bg-red-100 dark:bg-red-500/10' : 'bg-blue-100 dark:bg-blue-500/10'}`}>
                                                <ClipboardList size={14} className={req.type === 'Withdraw' ? 'text-red-500' : 'text-blue-500'} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                                    {req.student__user__full_name || req.student__roll_no}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {req.type} · {req.student__roll_no}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                            {new Date(req.request_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Recent Users */}
                    <motion.div
                        {...fadeUp(0.45)}
                        className="bg-white dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/[0.06] rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <Users size={16} className="text-indigo-500" />
                                Recent Users
                            </h3>
                            <Link
                                to="/admin/registration"
                                className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1 transition-colors"
                            >
                                View all <ChevronRight size={14} />
                            </Link>
                        </div>

                        {(!data?.recent_users || data.recent_users.length === 0) ? (
                            <p className="text-sm text-gray-400 italic text-center py-8">No users registered yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {data.recent_users.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04]"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${user.is_superuser ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-indigo-400 to-purple-500'}`}>
                                                {(user.full_name || user.username || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                                    {user.full_name || user.username}
                                                </p>
                                                <p className="text-xs text-gray-400 truncate">{user.email || 'No email'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-2">
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${user.is_superuser
                                                ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                                : 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                                            }`}>
                                                {user.is_superuser ? 'Admin' : 'Student'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>

            </div>
        </div>
    );
}
