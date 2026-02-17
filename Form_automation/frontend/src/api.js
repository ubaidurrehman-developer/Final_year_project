import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getUsers = () => api.get('users/');
export const getAuthentications = () => api.get('authentications/');
export const getAddresses = () => api.get('addresses/');
export const getStudents = () => api.get('students/');
export const getAdmins = () => api.get('admins/');
export const getSemesters = () => api.get('semesters/');
export const getCourses = () => api.get('courses/');
export const getStudentSemesters = () => api.get('student_semesters/');
export const getRegistrations = () => api.get('registrations/');
export const getAcademicRequests = () => api.get('academic_requests/');

export default api;
