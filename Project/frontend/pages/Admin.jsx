import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';

export default function Admin() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  
  // Logout user (no movement detected)
  useEffect(() => {
    let timer;
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const logout = async () => {
      localStorage.clear();
      showAlert({ message: "You have been logged out due to inactivity.", type: "warning", duration: 10000 });
      navigate("/login");
    };

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, 5 * 60 * 1000); // 5 minutes
    };

    const events = ['click', 'mousemove', 'keydown', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetTimer));

    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-600 mb-2">Total Students</h2>
            <p className="text-3xl font-bold text-blue-600">1,245</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-600 mb-2">Active Courses</h2>
            <p className="text-3xl font-bold text-green-600">28</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-600 mb-2">Pending Approvals</h2>
            <p className="text-3xl font-bold text-orange-600">12</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-600 mb-2">System Users</h2>
            <p className="text-3xl font-bold text-purple-600">156</p>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activities</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b">
              <p className="text-gray-700">New student registration approved</p>
              <p className="text-sm text-gray-500">30 mins ago</p>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <p className="text-gray-700">Course content updated</p>
              <p className="text-sm text-gray-500">2 hours ago</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-gray-700">System backup completed</p>
              <p className="text-sm text-gray-500">5 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
