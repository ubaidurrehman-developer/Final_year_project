import { Routes, Route } from 'react-router-dom';
import './App.css';
import Home from '../pages/Home';
import Layout from '../Layouts/layout'

function App() {
  return (
    <div className="App">
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Layout>
    </div>
  );
}

export default App;
