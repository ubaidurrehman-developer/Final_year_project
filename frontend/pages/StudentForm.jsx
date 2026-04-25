import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../src/index';
import { motion } from 'framer-motion';
import { FileEdit, History, ChevronRight, FileText, Plus } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

export default function StudentForm() {
  const [formData, setFormData] = useState({ editing: [], history: [] });
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const handleNewApplication = () => {
    // Navigate or open modal for new application
    console.log("Clicked On New Application ")
  };

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await api.get('/student-forms/'); 
        
        setFormData({
          history: response.data.history || [], 
          editing: []
        });
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, []);

  if (loading) return <div className="p-20 text-center font-bold text-purple-600">Syncing with Database...</div>;

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible" 
      className="min-h-screen bg-[#F8F9FB] p-4 md:p-8"
    >
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* HEADER AREA */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Form Submission</h1>
            <p className="text-sm text-gray-400">Manage your AI-detected submissions</p>
          </div>
          <button 
            onClick={handleNewApplication}
            className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all"
          >
            <Plus size={20} /> New Application
          </button>
        </div>


        {/* --- SECTION 2: SUBMISSION HISTORY --- */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <History className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Submission History</h2>
          </div>

          <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Student ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Form Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Fields</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {formData.history.map((sub) => (
                  <tr key={sub.submission_id} className="hover:bg-gray-50/50 transition-colors">
                    {/* 1. Submission ID */}
                    <td className="px-6 py-4 text-sm text-gray-600">#{sub.submission_id}</td>

                    {/* 2. Student ID */}
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{sub.student_id}</td>

                    {/* 3. Form Name (Extracted from your JSONB title) */}
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">
                      {sub.form_title || "Untitled Form"}
                    </td>

                    {/* 4. Submitted Date */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {sub.submitted_date}
                    </td>

                    {/* 5. Fields Detected (Extracting labels as text) */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-purple-600 text-[11px]">
                          {sub.input_fields?.fields?.length || 0} Fields
                        </span>
                        <p className="text-xs truncate max-w-[150px]">
                          {sub.input_fields?.fields?.map(f => f.input_label).join(", ") || "None"}
                        </p>
                      </div>
                    </td>

                    {/* 6. Status */}
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        sub.status === 'Approved' || sub.status === 'Active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
                
            {formData.history.length === 0 && (
              <div className="p-12 text-center text-gray-400 italic">No previous submissions yet.</div>
            )}
          </motion.div>
        </section>

      </div>
    </motion.div>
  );
}