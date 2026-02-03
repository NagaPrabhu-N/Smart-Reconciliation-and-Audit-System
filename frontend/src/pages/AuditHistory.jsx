// src/pages/History.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FileText, LogOut, UserPlus, ArrowLeft, Eye } from 'lucide-react';

const AuditHistory = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('userInfo'));
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await axios.get(
          'https://smart-recon-testing.vercel.app/api/audit',
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        setLogs(data);
      } catch (error) {
        console.error('Error fetching logs');
      }
    };
    fetchLogs();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const handleViewHistory = (jobId) => {
    navigate('/dashboard', { state: { historyJobId: jobId } });
  };

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      <div className="w-64 bg-white text-black p-6 fixed h-full border-r border-gray-300">
        <h2 className="text-2xl font-bold mb-8 tracking-wide">Smart Recon</h2>
        <nav className="space-y-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 w-full p-3 rounded-lg text-gray-700 hover:bg-gray-200 transition"
          >
            <ArrowLeft size={20} /> Back to Dashboard
          </button>
          <button className="flex items-center gap-3 w-full p-3 bg-gray-300 rounded-lg font-medium">
            <FileText size={20} /> Audit Trail
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/manage-users')}
              className="flex items-center gap-3 w-full p-3 mt-10 border-t border-gray-300 pt-6 text-gray-700 hover:bg-gray-200 rounded-lg transition"
            >
              <UserPlus size={20} /> Manage Users
            </button>
          )}
        </nav>
        <div className="absolute bottom-8 left-6 right-6">
          <div className="bg-gray-200 p-4 rounded-xl mb-4">
            <p className="text-xs text-gray-600 uppercase mb-1">Logged in as</p>
            <p className="font-bold truncate">{user?.username}</p>
            <p className="text-xs text-gray-700 mt-1 uppercase font-semibold">
              {user?.role}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-700 hover:text-black text-sm font-medium transition"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
      <div className="flex-1 ml-64 p-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Audit Trail</h1>
          <p className="text-gray-600 mb-10">
            Track all reconciliation activities and user modifications.
          </p>
          <div className="relative border-l-2 border-gray-300 ml-4 space-y-10 pb-10">
            {logs.map((log) => (
              <div key={log._id} className="relative pl-10">
                <div className="absolute -left-[9px] top-0 w-5 h-5 rounded-full bg-white border-4 border-gray-400"></div>
                <div className="bg-white p-6 rounded-xl border border-gray-300 hover:shadow transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg uppercase">
                        {log.action}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center font-bold text-[10px]">
                          {log.performedBy
                            ? log.performedBy.charAt(0).toUpperCase()
                            : 'U'}
                        </div>
                        <span className="font-medium">
                          {log.performedBy}
                        </span>
                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded uppercase border border-gray-300">
                          {log.role}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-4 rounded-lg border bg-gray-100 border-gray-300">
                    <p className="font-mono text-sm">{log.details}</p>
                  </div>
                  {log.jobId && (
                    <div className="mt-4 flex justify-end border-t border-gray-300 pt-4">
                      <button
                        onClick={() => handleViewHistory(log.jobId)}
                        className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-gray-400 hover:bg-gray-200 transition"
                      >
                        <Eye size={16} /> View Data Snapshot
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="pl-10 text-gray-500">
                No activity recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditHistory;
