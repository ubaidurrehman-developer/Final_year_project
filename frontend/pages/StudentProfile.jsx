import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';
import { api } from '../src/index';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const InfoField = ({ label, value }) => (
  <div className="flex flex-col space-y-1">
    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{label}</p>
    <p className="text-sm text-gray-700 font-semibold leading-tight">{value || '—'}</p>
  </div>
);

const SectionHeader = ({ title }) => (
  <h3 className="text-sm font-black text-purple-700 border-b border-purple-100 pb-1 mb-4 uppercase tracking-tighter">
    {title}
  </h3>
);

export default function StudentProfile() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/me/');
        setData(res.data);
      } catch (err) {
        showAlert({ message: "Session expired or error loading profile.", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showAlert]);

  if (loading) return <div className="flex h-screen items-center justify-center text-purple-600 animate-pulse font-bold">LOADING SECURE PORTAL...</div>;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="min-h-screen bg-[#F4F7FE] p-4 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: AVATAR & QUICK STATS */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm text-center">
            <div className="relative inline-block">
              <img 
                src={data.user.profile_pic || `https://ui-avatars.com/api/?name=${data.user.first_name}+${data.user.last_name}&background=6366f1&color=fff`} 
                className="w-32 h-32 rounded-3xl object-cover shadow-xl border-4 border-white mx-auto" 
                alt="Profile"
              />
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
            </div>
            <h2 className="mt-6 text-xl font-bold text-gray-800">{data.user.full_name || `${data.user.first_name} ${data.user.last_name}`}</h2>
            <p className="text-purple-600 font-bold text-xs mt-1">{data.roll_no}</p>
            <div className="mt-4 inline-block px-4 py-1 bg-purple-50 text-purple-600 text-[10px] font-black rounded-full uppercase">
              {data.status}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
            <SectionHeader title="Academic Calendar" />
            <InfoField label="Registration" value={data.academic_calendar.registration} />
            <InfoField label="Classes Start" value={data.academic_calendar.classes} />
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED INFO */}
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* University Info */}
              <div className="space-y-6">
                <SectionHeader title="University Information" />
                <div className="grid grid-cols-2 gap-4">
                  <InfoField label="Degree" value={data.degree} />
                  <InfoField label="Program" value={data.program} />
                  <InfoField label="Campus" value={data.campus} />
                  <InfoField label="Batch" value={data.batch} />
                </div>
              </div>

              {/* Personal Info */}
              <div className="space-y-6">
                <SectionHeader title="Personal Details" />
                <div className="grid grid-cols-2 gap-4">
                  <InfoField label="Gender" value={data.user.gender} />
                  <InfoField label="DOB" value={data.user.dob} />
                  <InfoField label="Blood Group" value={data.user.blood_group} />
                  <InfoField label="Nationality" value={data.user.nationality} />
                </div>
              </div>
            </div>

            <div className="mt-10 pt-10 border-t border-gray-50">
               <SectionHeader title="Contact Information" />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400 mb-2 uppercase">Permanent Address</p>
                    <p className="text-sm text-gray-700">{data.addresses.permanent.line}</p>
                    <p className="text-sm text-gray-500 font-medium">{data.addresses.permanent.city}, {data.addresses.permanent.country}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400 mb-2 uppercase">Current Address</p>
                    <p className="text-sm text-gray-700">{data.addresses.current.line}</p>
                    <p className="text-sm text-gray-500 font-medium">{data.addresses.current.city}, {data.addresses.current.country}</p>
                  </div>
               </div>
            </div>

            <div className="flex justify-end mt-10">
              <button className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-purple-700 transition-colors shadow-lg shadow-gray-200">
                Update Profile Request
              </button>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}