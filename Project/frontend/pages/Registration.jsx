import React, { useEffect, useState } from 'react';
import { getNames } from 'country-list';
import { useAlert } from '../context/AlertContext';

export default function Registration() {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        gender: '',
        dob: '',
        email: '',
        mobile: '',
        cnic: '',
        blood_group: '',
        nationality: '',
        password: '',
        retype_password: '',      
    });
    const [studentData, setStudentData] = useState({
        campus: '',
        program: '',
        degree: '',
        batch: '',
        status: '',
        roll_no: '',
    });

    const { showAlert } = useAlert();
    const countries = getNames();
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const genderOptions = [
        { value: "M", label: "Male" },
        { value: "F", label: "Female" },
        { value: "T", label: "Transgender" }
    ];

    const bloodGroupOptions = [
        { value: "O+", label: "O+" },
        { value: "O-", label: "O-" },
        { value: "A+", label: "A+" },
        { value: "A-", label: "A-" },
        { value: "B+", label: "B+" },
        { value: "B-", label: "B-" },
        { value: "AB+", label: "AB+" },
        { value: "AB-", label: "AB-" }
    ];

    const calculateAge = (dob) => {
        if (!dob) return '';
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.first_name) newErrors.first_name = 'First Name is Required';
        if (!formData.last_name) newErrors.last_name = 'Last Name is Required';
        if (!formData.gender) newErrors.gender = 'Gender is Required';
        if (!formData.dob) newErrors.dob = 'Date of Birth is Required';
        if (!formData.email) newErrors.email = 'Email is Required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
        if (!formData.mobile) newErrors.mobile = 'Mobile is required';
        else if (!/^\d{11}$/.test(formData.mobile.replace(/\D/g, ''))) newErrors.mobile = 'Invalid mobile';
        if (!formData.cnic) newErrors.cnic = 'CNIC is required';
        else if (!/^\d{13}$/.test(formData.cnic.replace(/\D/g, ''))) newErrors.cnic = 'Invalid CNIC';
        if (!formData.nationality) newErrors.nationality = 'Nationality is required';
        if (!formData.blood_group) newErrors.blood_group = 'Blood Group is required';
        if (formData.password !== formData.retype_password) newErrors.retype_password = 'Passwords do not match';
        if (!formData.password) newErrors.password = 'Password is required';
        if (!formData.retype_password) newErrors.retype_password = 'Retype Password is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        try {
            const age = calculateAge(formData.dob);
            const mobile = formData.mobile.replace(/\D/g, '').replace(/^(\d{4})(\d{0,7})$/, '$1-$2');
            const cnic = formData.cnic.replace(/\D/g, '').replace(/^(\d{5})(\d{7})(\d{0,1})$/, '$1-$2-$3');


            const BASE_URL = import.meta.env.VITE_API_BASE_URL + '/users/';
            const user = await fetch(`${BASE_URL}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    mobile: mobile,
                    cnic: cnic,
                    age: age
                })
            });

            if (user.ok) {
                showAlert('Admin Registered Successfully', 'success');
                setFormData({
                    first_name: '',
                    last_name: '',
                    gender: '',
                    dob: '',
                    email: '',
                    mobile: '',
                    cnic: '',
                    blood_group: '',
                    nationality: '',
                    password: '',
                    retype_password: '',
                    role: 'admin',
                });
            } else {
                const data = await user.json();
                console.log(data);
                showAlert('Registration Failed', 'error');
            }
        } catch (error) {
            console.log(error)
            showAlert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Registration</h1>
                    <p className="text-gray-600 mt-2">Create Admin Account</p>
                </div>

                <div className="bg-white rounded-lg shadow p-8">
                    {errors.submit && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            {errors.submit}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    placeholder="First Name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.first_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                                        }`}
                                />
                                {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name </label>
                                <input
                                    type="text"
                                    name="last_name"
                                    placeholder="Last Name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.last_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                                        }`}
                                />
                                {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password </label>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                                        }`}
                                />
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Retype Password </label>
                                <input
                                    type="password"
                                    name="retype_password"
                                    placeholder="••••••••"
                                    value={formData.retype_password}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.retype_password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                                        }`}
                                />
                                {errors.retype_password && <p className="text-red-500 text-xs mt-1">{errors.retype_password}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gender </label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.gender ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                                        }`}
                                >
                                    <option value="">Select Gender</option>
                                    {genderOptions.map((g) => (
                                        <option key={g.value} value={g.value}>{g.label}</option>
                                    ))}
                                </select>
                                {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth </label>
                                <input
                                    type="date"
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.dob ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                                        }`}
                                />
                                {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email </label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="user@gmail.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                                        }`}
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile </label>
                                <input
                                    type="text"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.mobile ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                                        }`}
                                    placeholder="03001234567"
                                />
                                {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CNIC </label>
                                <input
                                    type="text"
                                    name="cnic"
                                    value={formData.cnic}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.cnic ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                                        }`}
                                    placeholder="1234567890123"
                                />
                                {errors.cnic && <p className="text-red-500 text-xs mt-1">{errors.cnic}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group </label>
                                <select
                                    name="blood_group"
                                    value={formData.blood_group}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.blood_group ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                                        }`}
                                >
                                    <option value="">Select Blood Group</option>
                                    {bloodGroupOptions.map((bg) => (
                                        <option key={bg.value} value={bg.value}>{bg.label}</option>
                                    ))}
                                </select>
                                {errors.blood_group && <p className="text-red-500 text-xs mt-1">{errors.blood_group}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            <div className="">
                                <label className="block text-sm text-gray-700 mb-1">
                                    Nationality
                                </label>

                                <select
                                    name="nationality"
                                    value={formData.nationality}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.nationality
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-green-500'
                                        }`}
                                >
                                    <option value="">Select country</option>
                                    {countries.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                        </div>

                        <div className="p-3 text-lg bg-green-50 border border-green-200 rounded text-sm text-green-800">
                            <strong>Note:</strong> Your User ID will be generated automatically (i.e ahmed<b>.</b>khan).
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition"
                        >
                            {loading ? 'Registering...' : 'Register'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}


