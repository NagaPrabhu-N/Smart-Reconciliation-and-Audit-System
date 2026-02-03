import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, UserPlus, Shield, ShieldAlert, Eye } from 'lucide-react';

const ManageUsers = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('userInfo'));
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'analyst' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('https://smart-reconciliation-and-audit-syst.vercel.app/api/auth/users', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users');
    }
  };
  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await axios.post('https://smart-reconciliation-and-audit-syst.vercel.app/api/auth/register', formData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setSuccess('User created successfully!');
      setFormData({ username: '', email: '', password: '', role: 'analyst' }); // Reset form
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;

    try {
      await axios.delete(`https://smart-reconciliation-and-audit-syst.vercel.app/api/auth/users/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setUsers(users.filter(u => u._id !== id));
      setSuccess('User deleted successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans p-12 text-black">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8 border-b-2 border-black pb-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition text-black">
                <ArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-bold text-black tracking-tight">Manage Team</h1>
        </div>
        <div className="grid grid-cols-3 gap-8">
            <div className="col-span-1">
                <div className="bg-white p-6 rounded-md shadow-lg border border-gray-200">
                    <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
                        <UserPlus size={20} className="text-black"/> Add New User
                    </h2>
                    {error && <div className="bg-black text-white p-3 rounded-md text-sm mb-4 font-medium">{error}</div>}
                    {success && <div className="bg-gray-100 text-black border border-black p-3 rounded-md text-sm mb-4 font-medium">{success}</div>}
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-black mb-1 uppercase tracking-wide">Username</label>
                            <input 
                                type="text" 
                                required
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black outline-none transition bg-gray-50"
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-black mb-1 uppercase tracking-wide">Email</label>
                            <input 
                                type="email" 
                                required
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black outline-none transition bg-gray-50"
                                value={formData.email}
                                autoComplete="email"
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-black mb-1 uppercase tracking-wide">Password</label>
                            <input 
                                type="password" 
                                required
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black outline-none transition bg-gray-50"
                                value={formData.password}
                                autoComplete="new-password"
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-black mb-1 uppercase tracking-wide">Role</label>
                            <select 
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black outline-none bg-white transition"
                                value={formData.role}
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                            >
                                <option value="analyst">Analyst (Can Edit)</option>
                                <option value="viewer">Viewer (Read Only)</option>
                                <option value="admin">Admin (Full Access)</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full py-3 bg-black text-white rounded-md font-bold hover:bg-gray-800 transition shadow-md mt-2">
                            CREATE ACCOUNT
                        </button>
                    </form>
                </div>
            </div>

            <div className="col-span-2">
                <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-bold text-black uppercase tracking-wider text-sm">Existing Users</h3>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-black text-white uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="p-4">User</th>
                                <th className="p-4">Role</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {users.map((u) => (
                                <tr key={u._id} className="hover:bg-gray-50 transition">
                                    <td className="p-4">
                                        <div className="font-bold text-black">{u.username}</div>
                                        <div className="text-xs text-gray-500 font-mono">{u.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                                            u.role === 'admin' ? 'bg-black text-white border-black' :
                                            u.role === 'viewer' ? 'bg-gray-200 text-black border-transparent' :
                                            'bg-white text-black border-black'
                                        }`}>
                                            {u.role === 'admin' && <ShieldAlert size={12}/>}
                                            {u.role === 'analyst' && <Shield size={12}/>}
                                            {u.role === 'viewer' && <Eye size={12}/>}
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {/* Delete Button (Hide for self) */}
                                        {u._id !== user._id && (
                                            <button 
                                                onClick={() => handleDelete(u._id)}
                                                className="text-gray-400 hover:text-black p-2 hover:bg-gray-200 rounded-full transition"
                                                title="Delete User"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {users.length === 0 && (
                        <div className="p-8 text-center text-gray-400 italic">No users found.</div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;