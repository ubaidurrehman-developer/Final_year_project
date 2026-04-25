import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../src/index';
import { 
  FileCheck, 
  Clock, 
  BookOpen, 
  AlertCircle, 
  Bell,
  User,
  GraduationCap
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <motion.div variants={cardVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-400 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value ?? '—'}</p>
    </div>
    <div className={`p-3 rounded-xl ${colorClass}`}>
      <Icon size={24} />
    </div>
  </motion.div>
);

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/student-dashboard/');
        setData(response.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center text-purple-600 font-bold">
      Initializing Dashboard...
    </div>
  );

  if (error) return (
    <div className="flex h-screen items-center justify-center text-red-500 font-semibold">
      {error}
    </div>
  );

  const firstName = data?.full_name?.split(' ')[0] ?? 'Student';

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible" 
      className="min-h-screen bg-[#F8F9FB] p-4 md:p-8 ml-20"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* WELCOME HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome Back, {firstName}!</h1>
            <p className="text-sm text-gray-400">
              {data?.program ?? 'Student'} | FAST-NUCES
              {data?.roll_no ? ` | ${data.roll_no}` : ''}
            </p>
          </div>
          <button className="p-2 bg-white rounded-full border border-gray-100 text-gray-400 hover:text-purple-600 relative transition-all">
            <Bell size={20} />
            {data?.updates?.length > 0 && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>
        </div>

        {/* TOP STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Academic Status" value={data?.academic_status} icon={User} colorClass="bg-blue-50 text-blue-600" />
          <StatCard title="Forms Processed"  value={data?.forms}    icon={FileCheck}   colorClass="bg-green-50 text-green-600" />
          <StatCard title="Pending Requests" value={data?.requests}  icon={AlertCircle} colorClass="bg-orange-50 text-orange-600" />
          <StatCard title="Credit Hours"     value={data?.total_credits} icon={BookOpen}    colorClass="bg-purple-50 text-purple-600" />
        </div>

        {/* MAIN DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ACADEMIC OVERVIEW */}
          <motion.div variants={cardVariants} className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <GraduationCap className="text-indigo-600" size={24} /> Academic Overview
                </h2>
                <p className="text-sm text-gray-400 mt-1">Current Semester: <span className="font-semibold text-indigo-600">{data?.current_semester}</span></p>
              </div>
              <div className="px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider">
                {data?.batch} Batch
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Course Code</th>
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Course Name</th>
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Credits</th>
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Semester</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.course_list?.length > 0 ? data.course_list.map((course, idx) => (
                    <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 text-sm font-bold text-gray-700">{course.code}</td>
                      <td className="py-4 text-sm text-gray-600">{course.name}</td>
                      <td className="py-4 text-sm text-gray-600 text-center">{course.credits}</td>
                      <td className="py-4 text-sm text-gray-400 text-right">{course.semester}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-gray-400 text-sm">No courses found for current semester.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* RECENT NOTIFICATIONS - Mapped from Database */}
          <motion.div variants={cardVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Clock size={18} className="text-indigo-500" /> Recent Updates
            </h3>
            <div className="space-y-6">
              {data?.updates?.length > 0 ? data.updates.map((update) => (
                <div key={update.id} className="flex gap-4 items-start border-l-2 border-indigo-100 pl-4 py-1 hover:border-indigo-400 transition-colors">
                  <div className="text-[10px] text-gray-400 mt-1 uppercase font-bold whitespace-nowrap">{update.time}</div>
                  <p className="text-sm text-gray-600 font-medium">{update.msg}</p>
                </div>
              )) : (
                <p className="text-sm text-gray-400 text-center py-4">No recent activity.</p>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}