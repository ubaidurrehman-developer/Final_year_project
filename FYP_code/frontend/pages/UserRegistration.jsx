import React, { useEffect, useState } from 'react';
import { getNames } from 'country-list';
import { useAlert } from '../context/AlertContext';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../src/index';

export default function Registration() {
    const navigate = useNavigate();
    const [role, setRole] = useState('admin');
    const { showAlert } = useAlert();
    const countries = getNames();
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [sameAddress, setSameAddress] = useState(false);

    const [userData, setUserData] = useState({
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
        campus: 'P',
        program: 'CS',
        degree: 'BS',
        batch: '20',
        status: 'Active',
    });

    const [addressData, setAddressData] = useState({
        permanent: {
            address: '',
            city: '',
            province: '',
            country: '',
            postal_code: '',
        },
        current: {
            address: '',
            city: '',
            province: '',
            country: '',
            postal_code: '',
        },
    });

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

    const campusOptions = [
        { value: "P", label: "Peshawar" },
        { value: "I", label: "Islamabad" },
        { value: "K", label: "Karachi" },
        { value: "L", label: "Lahore" },
        { value: "M", label: "Multan" },
        { value: "F", label: "Faisalabad" }
    ];

    const programOptions = [
        { value: "AI", label: "Artificial Intelligence" },
        { value: "CS", label: "Computer Science" },
        { value: "SE", label: "Software Engineering" },
        { value: "CE", label: "Computer Engineering" }
    ];

    const degreeOptions = [
        { value: "BS", label: "Bachelor of Science" },
        { value: "MS", label: "Master of Science" },
        { value: "PHD", label: "Doctor of Philosophy" }
    ];

    const formatMobile = (value) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length < 5) return digits;
        return `${digits.slice(0, 4)}-${digits.slice(4, 11)}`;
    };

    const formatCNIC = (value) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length < 6) return digits;
        if (digits.length < 13)
            return `${digits.slice(0, 5)}-${digits.slice(5, 12)}`;
        return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
    };

    const handleUserChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === 'mobile') {
            formattedValue = formatMobile(value);
        }
        if (name === 'cnic') {
            formattedValue = formatCNIC(value);
        }

        setUserData((prev) => ({
            ...prev,
            [name]: formattedValue
        }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleStudentChange = (e) => {
        const { name, value } = e.target;
        setStudentData((prev) => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleAddressChange = (type, e) => {
        const { name, value } = e.target;
        setAddressData((prev) => ({
            ...prev,
            [type]: {
                ...prev[type],
                [name]: value
            }
        }));

        // If "same address" is checked, update current address too
        if (type === 'permanent' && sameAddress) {
            setAddressData((prev) => ({
                ...prev,
                current: {
                    ...prev.current,
                    [name]: value
                }
            }));
        }

        if (errors[`${type}_${name}`]) {
            setErrors((prev) => ({ ...prev, [`${type}_${name}`]: '' }));
        }
    };

    const handleSameAddressChange = (e) => {
        const checked = e.target.checked;
        setSameAddress(checked);

        if (checked) {
            // Copy permanent address to current address
            setAddressData((prev) => ({
                ...prev,
                current: { ...prev.permanent }
            }));
        } else {
            // Clear current address
            setAddressData((prev) => ({
                ...prev,
                current: {
                    address: '',
                    city: '',
                    province: '',
                    country: '',
                    postal_code: '',
                }
            }));
        }
    };

    const handleBatchChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');

        // Always keep "20" at start
        if (!value.startsWith('20')) {
            value = '20';
        }

        // Limit to 4 digits
        if (value.length > 4) {
            value = value.slice(0, 4);
        }

        setStudentData((prev) => ({ ...prev, batch: value }));
    };

    const validateStep = (step) => {
        const newErrors = {};
        const isAddressStep = (role === 'admin' && step === 2) || (role === 'student' && step === 3);

        if (step === 1) {
            // Basic Information validation
            if (!userData.first_name) newErrors.first_name = 'First Name is Required';
            if (!userData.last_name) newErrors.last_name = 'Last Name is Required';
            if (!userData.gender) newErrors.gender = 'Gender is Required';
            if (!userData.dob) newErrors.dob = 'Date of Birth is Required';
            if (!userData.email) newErrors.email = 'Email is Required';
            if (!userData.mobile) newErrors.mobile = 'Mobile is required';
            if (!userData.cnic) newErrors.cnic = 'CNIC is required';
            if (!userData.nationality) newErrors.nationality = 'Nationality is required';
            if (!userData.blood_group) newErrors.blood_group = 'Blood Group is required';
            if (!userData.password) newErrors.password = 'Password is required';
            if (!userData.retype_password) {
                newErrors.retype_password = 'Retype Password is required';
            } else if (userData.password !== userData.retype_password) {
                newErrors.retype_password = 'Passwords do not match';
            }
        } else if (step === 2 && role === 'student') {
            // Academic Information validation (Student only)
            if (!studentData.campus) newErrors.campus = 'Campus is required';
            if (!studentData.program) newErrors.program = 'Program is required';
            if (!studentData.degree) newErrors.degree = 'Degree is required';
            if (!studentData.batch || studentData.batch.length !== 4) newErrors.batch = 'Valid Batch year is required (e.g., 2024)';
        } else if (isAddressStep) {
            // Address validation
            if (!addressData.permanent.address) newErrors.permanent_address = 'Permanent Address is required';
            if (!addressData.permanent.city) newErrors.permanent_city = 'Permanent City is required';
            if (!addressData.permanent.province) newErrors.permanent_province = 'Permanent Province is required';
            if (!addressData.permanent.country) newErrors.permanent_country = 'Permanent Country is required';
            if (!addressData.permanent.postal_code) newErrors.permanent_postal_code = 'Permanent Postal Code is required';

            if (!sameAddress) {
                if (!addressData.current.address) newErrors.current_address = 'Current Address is required';
                if (!addressData.current.city) newErrors.current_city = 'Current City is required';
                if (!addressData.current.province) newErrors.current_province = 'Current Province is required';
                if (!addressData.current.country) newErrors.current_country = 'Current Country is required';
                if (!addressData.current.postal_code) newErrors.current_postal_code = 'Current Postal Code is required';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handlePrevious = () => {
        setCurrentStep((prev) => prev - 1);
        setErrors({});
    };

    const handleRoleChange = (newRole) => {
        setRole(newRole);
        setCurrentStep(1);
        setErrors({});
    };

    const getTotalSteps = () => {
        return role === 'admin' ? 2 : 3;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep(currentStep)) return;

        setLoading(true);

        const mobile = userData.mobile.replace(/\D/g, '').replace(/^(\d{4})(\d{0,7})$/, '$1-$2');
        const cnic = userData.cnic.replace(/\D/g, '').replace(/^(\d{5})(\d{7})(\d{0,1})$/, '$1-$2-$3');

        const payload = {
            ...userData,
            mobile,
            cnic,
        };

        // Remove retype_password as it's not needed in backend
        delete payload.retype_password;

        // Add student data if role is student
        if (role === 'student') {
            payload.student = {
                campus: studentData.campus,
                program: studentData.program,
                degree: studentData.degree,
                batch: studentData.batch,
            };
        }

        // Add addresses
        payload.addresses = [
            {
                address_type: 'Permanent',
                ...addressData.permanent
            },
        ];
        if (!sameAddress) {
            payload.addresses.push({
                address_type: 'Current',
                ...addressData.current
            });
        }

        try {
            const { data } = await api.post(
                `/users/`,
                payload
            );

            showAlert(`${role === 'admin' ? 'Admin' : 'Student'} Registered Successfully!`, 'success',5000);
            showAlert(`Those are your login credentials(Remember them): Username: ${data.username}, Password: ${data.password}`, 'info', 10000);

            // Reset all form data
            setUserData({
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

            setStudentData({
                campus: 'P',
                program: 'CS',
                degree: 'BS',
                batch: '20',
            });

            setAddressData({
                permanent: {
                    address: '',
                    city: '',
                    province: '',
                    country: '',
                    postal_code: '',
                },
                current: {
                    address: '',
                    city: '',
                    province: '',
                    country: '',
                    postal_code: '',
                },
            });

            setCurrentStep(1);
            setSameAddress(false);            

        } catch (err) {
            showAlert(
                err.response?.data?.message || 'Registration Failed',
                'error'
            );
            setLoading(false);
        }
    };

    const renderStepIndicator = () => {
        const totalSteps = getTotalSteps();
        return (
            <div className="flex items-center justify-center mb-3">
                {[...Array(totalSteps)].map((_, index) => (
                    <React.Fragment key={index}>
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep > index + 1
                                    ? 'bg-green-600 text-white'
                                    : currentStep === index + 1
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-300 text-gray-600'
                                    }`}
                            >
                                {currentStep > index + 1 ? '✓' : index + 1}
                            </div>
                            <span className="text-xs mt-1 text-gray-600">
                                {index === 0 ? 'Basic' : index === 1 ? (role === 'admin' ? 'Address' : 'Academic') : 'Address'}
                            </span>
                        </div>
                        {index < totalSteps - 1 && (
                            <div className={`w-16 h-1 mx-2 ${currentStep > index + 1 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    const renderStep1 = () => (
        <>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                        type="text"
                        name="first_name"
                        placeholder="First Name"
                        value={userData.first_name}
                        onChange={handleUserChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.first_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                    />
                    {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                        type="text"
                        name="last_name"
                        placeholder="Last Name"
                        value={userData.last_name}
                        onChange={handleUserChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.last_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                    />
                    {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        value={userData.password}
                        onChange={handleUserChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Retype Password</label>
                    <input
                        type="password"
                        name="retype_password"
                        placeholder="••••••••"
                        value={userData.retype_password}
                        onChange={handleUserChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.retype_password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                    />
                    {errors.retype_password && <p className="text-red-500 text-xs mt-1">{errors.retype_password}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                        name="gender"
                        value={userData.gender}
                        onChange={handleUserChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.gender ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                        type="date"
                        name="dob"
                        value={userData.dob}
                        onChange={handleUserChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.dob ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                    />
                    {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="user@gmail.com"
                        value={userData.email}
                        onChange={handleUserChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                    <input
                        type="text"
                        name="mobile"
                        value={userData.mobile}
                        onChange={handleUserChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.mobile ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                        placeholder="0300-1234567"
                    />
                    {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CNIC</label>
                    <input
                        type="text"
                        name="cnic"
                        value={userData.cnic}
                        onChange={handleUserChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.cnic ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                        placeholder="12345-1234567-1"
                    />
                    {errors.cnic && <p className="text-red-500 text-xs mt-1">{errors.cnic}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                    <select
                        name="blood_group"
                        value={userData.blood_group}
                        onChange={handleUserChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.blood_group ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
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

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <select
                    name="nationality"
                    value={userData.nationality}
                    onChange={handleUserChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.nationality ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                        }`}
                >
                    <option value="">Select Country</option>
                    {countries.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                {errors.nationality && <p className="text-red-500 text-xs mt-1">{errors.nationality}</p>}
            </div>
        </>
    );

    const renderStep2Student = () => (
        <>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Academic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
                    <select
                        name="campus"
                        value={studentData.campus}
                        onChange={handleStudentChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.campus ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                    >
                        {campusOptions.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                    {errors.campus && <p className="text-red-500 text-xs mt-1">{errors.campus}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                    <select
                        name="program"
                        value={studentData.program}
                        onChange={handleStudentChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.program ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                    >
                        {programOptions.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </select>
                    {errors.program && <p className="text-red-500 text-xs mt-1">{errors.program}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                    <select
                        name="degree"
                        value={studentData.degree}
                        onChange={handleStudentChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.degree ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                    >
                        {degreeOptions.map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                    </select>
                    {errors.degree && <p className="text-red-500 text-xs mt-1">{errors.degree}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                    <input
                        type="text"
                        name="batch"
                        value={studentData.batch}
                        onChange={handleBatchChange}
                        maxLength={4}
                        placeholder="2024"
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.batch ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                    />
                    {errors.batch && <p className="text-red-500 text-xs mt-1">{errors.batch}</p>}
                </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                <strong>Note:</strong> Your Roll Number will be generated automatically based on your campus and batch.
            </div>
        </>
    );

    const renderAddressStep = () => (
        <>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Address Information</h2>

            {/* Permanent Address */}
            <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-700 mb-3">Permanent Address</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <textarea
                            name="address"
                            value={addressData.permanent.address}
                            onChange={(e) => handleAddressChange('permanent', e)}
                            rows={2}
                            placeholder="Street address"
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.permanent_address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                }`}
                        />
                        {errors.permanent_address && <p className="text-red-500 text-xs mt-1">{errors.permanent_address}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input
                                type="text"
                                name="city"
                                value={addressData.permanent.city}
                                onChange={(e) => handleAddressChange('permanent', e)}
                                placeholder="City"
                                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.permanent_city ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                            />
                            {errors.permanent_city && <p className="text-red-500 text-xs mt-1">{errors.permanent_city}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                            <input
                                type="text"
                                name="province"
                                value={addressData.permanent.province}
                                onChange={(e) => handleAddressChange('permanent', e)}
                                placeholder="Province/State"
                                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.permanent_province ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                            />
                            {errors.permanent_province && <p className="text-red-500 text-xs mt-1">{errors.permanent_province}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                            <input
                                type="text"
                                name="country"
                                value={addressData.permanent.country}
                                onChange={(e) => handleAddressChange('permanent', e)}
                                placeholder="Country"
                                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.permanent_country ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                            />
                            {errors.permanent_country && <p className="text-red-500 text-xs mt-1">{errors.permanent_country}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                            <input
                                type="text"
                                name="postal_code"
                                value={addressData.permanent.postal_code}
                                onChange={(e) => handleAddressChange('permanent', e)}
                                placeholder="Postal Code"
                                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.permanent_postal_code ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                            />
                            {errors.permanent_postal_code && <p className="text-red-500 text-xs mt-1">{errors.permanent_postal_code}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Same as Permanent Checkbox */}
            <div className="mb-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={sameAddress}
                        onChange={handleSameAddressChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Current address is same as permanent address</span>
                </label>
            </div>

            {/* Current Address */}
            {!sameAddress && (
                <div>
                    <h3 className="text-md font-semibold text-gray-700 mb-3">Current Address</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <textarea
                                name="address"
                                value={addressData.current.address}
                                onChange={(e) => handleAddressChange('current', e)}
                                rows={2}
                                placeholder="Street address"
                                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.current_address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                            />
                            {errors.current_address && <p className="text-red-500 text-xs mt-1">{errors.current_address}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={addressData.current.city}
                                    onChange={(e) => handleAddressChange('current', e)}
                                    placeholder="City"
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.current_city ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                        }`}
                                />
                                {errors.current_city && <p className="text-red-500 text-xs mt-1">{errors.current_city}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                                <input
                                    type="text"
                                    name="province"
                                    value={addressData.current.province}
                                    onChange={(e) => handleAddressChange('current', e)}
                                    placeholder="Province/State"
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.current_province ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                        }`}
                                />
                                {errors.current_province && <p className="text-red-500 text-xs mt-1">{errors.current_province}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={addressData.current.country}
                                    onChange={(e) => handleAddressChange('current', e)}
                                    placeholder="Country"
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.current_country ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                        }`}
                                />
                                {errors.current_country && <p className="text-red-500 text-xs mt-1">{errors.current_country}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                                <input
                                    type="text"
                                    name="postal_code"
                                    value={addressData.current.postal_code}
                                    onChange={(e) => handleAddressChange('current', e)}
                                    placeholder="Postal Code"
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.current_postal_code ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                        }`}
                                />
                                {errors.current_postal_code && <p className="text-red-500 text-xs mt-1">{errors.current_postal_code}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-5 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <ArrowLeft
                        onClick={() => navigate('/admin')}
                        className="cursor-pointer"
                    />
                    <div className="text-center mb-3">
                        <h1 className="text-3xl font-bold text-gray-900">Registration Form</h1>
                        <p className="text-gray-600 mt-2">Create a New Account</p>
                    </div>
                    {/* Role Selection */}
                    <div className="mb-6">
                        <label className="block text-lg font-medium text-gray-700 mb-3">Select User Type</label>
                        <div className="flex gap-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="role"
                                    checked={role === 'admin'}
                                    onChange={() => handleRoleChange('admin')}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-sm font-medium">Admin</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="role"
                                    checked={role === 'student'}
                                    onChange={() => handleRoleChange('student')}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-sm font-medium">Student</span>
                            </label>
                        </div>
                    </div>

                    {/* Step Indicator */}
                    {renderStepIndicator()}

                    {/* Form Steps */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {currentStep === 1 && renderStep1()}
                        {currentStep === 2 && role === 'student' && renderStep2Student()}
                        {((currentStep === 2 && role === 'admin') || (currentStep === 3 && role === 'student')) && renderAddressStep()}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between gap-4 pt-4">
                            {currentStep > 1 && (
                                <button
                                    type="button"
                                    onClick={handlePrevious}
                                    className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Previous
                                </button>
                            )}

                            {currentStep < getTotalSteps() ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="ml-auto px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition"
                                >
                                    {loading ? 'Submitting...' : 'Submit'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
