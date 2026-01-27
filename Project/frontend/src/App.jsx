import { Routes, Route } from 'react-router-dom';
import * as pages from '../pages'
import { Navigate } from 'react-router-dom';
import Layout from '../layouts/Layout';

function App() {
  const ProtectedRoute = ({ children, role }) => {
  const userRole = localStorage.getItem("role")
  if (!userRole) return <Navigate to="/login" />
  if (role && userRole !== role) return <Navigate to="/login" />
  return children
}

  return (
    <div className="App">
      <Layout>
        <Routes>
          <Route path="/" element={<pages.Home />} />
          <Route path='/login' element={<pages.Login />} />
          <Route path='/admin' element={<ProtectedRoute role="admin"><pages.Admin /></ProtectedRoute>} />
          <Route path='/student' element={<ProtectedRoute role="student"><pages.Student /></ProtectedRoute>} />
          <Route path='/student/register' element={<pages.StudentRegistration />} />
          <Route path='/registration' element={<pages.Registration />} />          
          <Route path='/forgot-password' element={<pages.ForgotPassword />} />          
        </Routes>
      </Layout>
    </div>
  );
}

export default App;
