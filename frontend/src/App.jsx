// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AuditHistory from './pages/AuditHistory';
import ManageUsers from './pages/ManageUsers';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/history" element={<AuditHistory />} />
        <Route path="/manage-users" element={<ManageUsers />} />
      </Routes>
    </Router>
  );
}

export default App;