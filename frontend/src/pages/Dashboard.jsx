// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { LayoutDashboard, Upload, FileText, LogOut, UserPlus, Edit2, X, Save, ArrowRight, Search, Database } from 'lucide-react';
import ReconciliationChart from '../components/ReconciliationChart';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('userInfo'));
  const [step, setStep] = useState('upload');
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
  const [systemFile, setSystemFile] = useState(null);
  const [systemLoading, setSystemLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [previewData, setPreviewData] = useState(null);
  const [tempFilename, setTempFilename] = useState('');
  const [mapping, setMapping] = useState({ transactionID: '', amount: '', referenceNumber: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [formData, setFormData] = useState({});

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  useEffect(() => {
    const loadData = async () => {
      const token = user?.token;
      if (location.state?.historyJobId) {
         try {
            setLoading(true);
            const { data } = await axios.get(`https://smart-recon-testing.vercel.app/api/recon/status/${location.state.historyJobId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (data) {
                setReport(data.data);
                setStep('report');
            }
            setLoading(false);
         } catch (error) {
            console.error("Failed to load history");
            setLoading(false);
         }
         return; 
      }
      if (user?.role === 'viewer') {
        try {
          setLoading(true);
          const { data } = await axios.get('https://smart-recon-testing.vercel.app/api/recon/latest', {
             headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (data && data.data.length > 0) {
            setReport(data.data);
            setStep('report'); 
          }
          setLoading(false);
        } catch (error) {
          console.log("No previous data found for viewer.");
          setLoading(false);
        }
        return;
      }
      const savedJobId = localStorage.getItem('activeJobId');
      if (savedJobId) {
        try {
          setLoading(true);
          const { data } = await axios.get(`https://smart-recon-testing.vercel.app/api/recon/status/${savedJobId}`, {
             headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (data.status === 'Completed') {
            setReport(data.data);
            setStep('report');
          }
          setLoading(false);
        } catch (error) {
          console.error("Failed to restore session", error);
          localStorage.removeItem('activeJobId');
          setLoading(false);
        }
      }
    };

    loadData();
  }, []); 
  const resetDashboard = () => {
      localStorage.removeItem('activeJobId'); 
      setStep('upload');
      setReport(null);
      setFile(null);
      setPreviewData(null);
      setTempFilename('');
  };

  const onDrop = (acceptedFiles) => setFile(acceptedFiles[0]);
  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleSystemUpload = async () => {
      if (!systemFile) return alert('Please select a file');
      setSystemLoading(true);
      const formData = new FormData();
      formData.append('file', systemFile);

      try {
          await axios.post('https://smart-recon-testing.vercel.app/api/recon/system-upload', formData, {
              headers: { 
                  'Content-Type': 'multipart/form-data',
                  'Authorization': `Bearer ${user?.token}`
              }
          });
          alert('System Records Updated Successfully!');
          setIsSystemModalOpen(false);
          setSystemFile(null);
      } catch (error) {
          alert('Failed to update system records');
      } finally {
          setSystemLoading(false);
      }
  };
  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = user?.token;
      const { data } = await axios.post('https://smart-recon-testing.vercel.app/api/recon/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` },
      });
      
      setPreviewData(data);
      setTempFilename(data.filename);
      
      const headers = data.headers;
      setMapping({
        transactionID: headers.find(h => h.toLowerCase().includes('id')) || headers[0],
        amount: headers.find(h => h.toLowerCase().includes('amount')) || headers[1],
        referenceNumber: headers.find(h => h.toLowerCase().includes('ref')) || '' 
      });
      
      setStep('preview');
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
      alert('Error previewing file');
    }
  };
  const handleProcess = async () => {
    setLoading(true);
    try {
      const token = user?.token;
      
      const formData = new FormData();
      formData.append('file', file); 
      formData.append('mapping', JSON.stringify(mapping)); 

      const { data: startData } = await axios.post(
        'https://smart-recon-testing.vercel.app/api/recon/upload', 
        formData, 
        {
          headers: { 
            'Content-Type': 'multipart/form-data', 
            'Authorization': `Bearer ${token}` 
          },
        }
      );

      if (startData.jobId) localStorage.setItem('activeJobId', startData.jobId);

      if (startData.isCached) {
         alert('Cached result found.');
         const { data: resultData } = await axios.get(`https://smart-recon-testing.vercel.app/api/recon/status/${startData.jobId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
         });
         setReport(resultData.data);
         setStep('report');
         setLoading(false);
         return;
      }

      const jobId = startData.jobId;
      const pollInterval = setInterval(async () => {
         try {
            const { data: statusData } = await axios.get(`https://smart-recon-testing.vercel.app/api/recon/status/${jobId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (statusData.status === 'Completed') {
                clearInterval(pollInterval);
                setReport(statusData.data);
                setStep('report');
                setLoading(false);
            } else if (statusData.status === 'Failed') {
                clearInterval(pollInterval);
                setLoading(false);
                alert('Processing Failed');
            }
         } catch (err) {
            clearInterval(pollInterval);
            setLoading(false);
         }
      }, 2000); 

    } catch (error) {
      console.error(error);
      setLoading(false);
      alert(error.response?.data?.message || 'Error starting process');
    }
  };

  const handleEditClick = (row) => {
    setEditRow(row);
    setFormData({ 
      newAmount: row.fileAmount, 
      status: row.status, 
      notes: row.adminNotes || row.notes 
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      const token = user?.token;
      await axios.put(`https://smart-recon-testing.vercel.app/api/recon/update/${editRow._id}`, formData, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const updatedReport = report.map(r => r._id === editRow._id ? { ...r, ...formData, fileAmount: formData.newAmount } : r);
      setReport(updatedReport);
      
      setIsEditing(false);
      alert('Record updated successfully!');
    } catch (error) {
      alert('Failed to update record');
    }
  };
  const stats = report ? {
    total: report.length,
    matched: report.filter(r => r.status === 'Matched').length,
    mismatch: report.filter(r => r.status !== 'Matched').length,
    accuracy: report.length > 0 ? ((report.filter(r => r.status === 'Matched').length / report.length) * 100).toFixed(1) : 0
  } : null;

  const filteredReport = report ? report.filter(row => {
    if (statusFilter !== 'All' && row.status !== statusFilter) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const idMatch = row.transactionID?.toLowerCase().includes(searchLower);
      const noteMatch = (row.adminNotes || row.notes)?.toLowerCase().includes(searchLower);
      return idMatch || noteMatch;
    }
    return true;
  }) : [];

  return (
    <div className="flex min-h-screen bg-white font-sans text-black">
      <div className="w-64 bg-black text-white p-6 fixed h-full z-10 border-r border-gray-800">
        <h2 className="text-2xl font-bold mb-8 tracking-wide text-white">Smart Recon</h2>
        <nav className="space-y-4">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 w-full p-3 bg-white text-black rounded-md shadow-sm font-medium">
            <LayoutDashboard size={20} /> Dashboard
          </button>
          {user?.role !== 'viewer' && step !== 'upload' && (
              <button 
                  onClick={resetDashboard} 
                  className="flex items-center gap-3 w-full p-3 hover:bg-gray-800 rounded-md text-gray-300 hover:text-white transition"
              >
                <Upload size={20} /> Upload New File
              </button>
          )}
          {user?.role === 'admin' && (
             <button 
                onClick={() => setIsSystemModalOpen(true)}
                className="flex items-center gap-3 w-full p-3 hover:bg-gray-800 rounded-md text-gray-300 hover:text-white transition"
             >
                <Database size={20} /> Update System Data
             </button>
          )}
          <button onClick={() => navigate('/history')} className={`flex items-center gap-3 w-full p-3 hover:bg-gray-800 rounded-md text-gray-300 hover:text-white transition`}>
            <FileText size={20} /> Audit Trail
          </button>
          {user?.role === 'admin' && (
             <button onClick={() => navigate('/manage-users')} className="flex items-center gap-3 w-full p-3 hover:bg-gray-800 rounded-md text-gray-300 hover:text-white mt-10 border-t border-gray-800 pt-6">
               <UserPlus size={20} /> Manage Users
             </button>
          )}
        </nav>
        <div className="absolute bottom-8 left-6 right-6">
          <div className="bg-gray-900 p-4 rounded-md mb-4 border border-gray-800">
             <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Logged in as</p>
             <p className="font-bold text-white truncate">{user?.username}</p>
             <p className="text-xs text-gray-400 mt-1 uppercase font-semibold">{user?.role}</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
      <div className="flex-1 ml-64 p-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-black border-b-2 border-black pb-2">Reconciliation Dashboard</h1>
          </div>
          {step === 'upload' && user?.role !== 'viewer' && (
            <div className="bg-white p-16 rounded-md border-2 border-dashed border-black text-center hover:bg-gray-50 transition-colors group">
              <div {...getRootProps()} className="cursor-pointer">
                <input {...getInputProps()} />
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                  <Upload size={32} className="text-white" />
                </div>
                <span className="inline-block bg-black text-white font-bold px-4 py-1.5 rounded-full text-sm mb-4">
                    Upload File
                </span>
                <p className="text-xl font-medium text-black">Drop your bank statement here</p>
                <p className="text-gray-500 mt-2">Support CSV files up to 50MB</p>
              </div>
              {file && (
                <div className="mt-8 bg-gray-50 inline-block px-6 py-4 rounded-md border border-gray-200">
                  <p className="font-semibold text-black mb-3">{file.name}</p>
                  <button onClick={handlePreview} disabled={loading} className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 font-medium transition">
                    {loading ? 'Analyzing File...' : 'Next: Map Columns'}
                  </button>
                </div>
              )}
            </div>
          )}
          {step === 'preview' && previewData && (
             <div className="bg-white p-8 rounded-md border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-black mb-6">Map Your Columns</h3>   
                <div className="grid grid-cols-3 gap-8 mb-8">      
                    <div>
                        <label className="block text-sm font-bold text-black mb-2">Transaction ID</label>
                        <select 
                            className="w-full p-3 border border-black rounded-md bg-white focus:ring-2 focus:ring-black outline-none"
                            value={mapping.transactionID}
                            onChange={(e) => setMapping({...mapping, transactionID: e.target.value})}
                        >
                            {previewData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-black mb-2">Amount</label>
                        <select 
                            className="w-full p-3 border border-black rounded-md bg-white focus:ring-2 focus:ring-black outline-none"
                            value={mapping.amount}
                            onChange={(e) => setMapping({...mapping, amount: e.target.value})}
                        >
                            {previewData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-black mb-2">Reference (Optional)</label>
                        <select 
                            className="w-full p-3 border border-black rounded-md bg-white focus:ring-2 focus:ring-black outline-none"
                            value={mapping.referenceNumber}
                            onChange={(e) => setMapping({...mapping, referenceNumber: e.target.value})}
                        >
                            <option value="">-- Skip --</option>
                            {previewData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                </div>

                <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-4">File Preview (First 20 Rows)</h4>
                <div className="overflow-x-auto border border-gray-200 rounded-md mb-8">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-black text-white">
                            <tr>{previewData.headers.map(h => <th key={h} className="p-3 font-semibold">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {previewData.preview.map((row, i) => (
                                <tr key={i}>
                                    {previewData.headers.map(h => <td key={h} className="p-3 text-gray-700">{row[h]}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex gap-4">
                    <button onClick={resetDashboard} className="px-6 py-2 text-black border border-gray-300 hover:bg-gray-100 rounded-md transition font-medium">Cancel</button>
                    <button onClick={handleProcess} disabled={loading} className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 flex items-center gap-2 font-medium">
                        {loading ? 'Processing...' : <>Confirm & Process <ArrowRight size={18} /></>}
                    </button>
                </div>
            </div>
          )}
          {step === 'report' && report && (
            <>
                <div className="grid grid-cols-3 gap-6 mb-10">
                <div className="col-span-2 grid grid-cols-2 gap-6">
                    {[
                    { label: 'Total Records', val: stats.total },
                    { label: 'Matched', val: stats.matched },
                    { label: 'Exceptions', val: stats.mismatch },
                    { label: 'Accuracy', val: `${stats.accuracy}%` }
                    ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-md shadow-sm border border-gray-200 flex flex-col justify-center">
                        <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">{stat.label}</p>
                        <h3 className="text-4xl font-bold mt-2 text-black">{stat.val}</h3>
                    </div>
                    ))}
                </div>
                <div className="col-span-1 min-h-[320px] bg-white border border-gray-200 rounded-md p-4">
                    <ReconciliationChart report={report} />
                </div>
                </div>

                <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex flex-wrap gap-4 justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-4 flex-1">
                        <h3 className="font-bold text-lg text-black mr-4">Report</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search ID or Notes..." 
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-black w-64 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select 
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-black bg-white"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Matched">Matched</option>
                            <option value="Mismatch">Mismatch</option>
                            <option value="Partial Match">Partial Match</option>
                            <option value="Duplicate">Duplicate</option>
                        </select>
                    </div>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead className="bg-black text-white uppercase text-xs font-bold tracking-wider">
                    <tr>
                        <th className="p-5">Transaction ID</th>
                        <th className="p-5">System Amt</th>
                        <th className="p-5">File Amt</th>
                        <th className="p-5">Status</th>
                        <th className="p-5">Notes</th>
                        <th className="p-5 text-right">{user.role === 'admin'  && (<span>Action</span>)}</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {filteredReport.length > 0 ? (
                        filteredReport.map((row) => (
                        <tr key={row._id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-5 font-mono text-sm text-black font-medium">{row.transactionID}</td>
                        <td className="p-5 text-gray-500">{row.systemAmount ? `$${row.systemAmount}` : '-'}</td>
                        <td className={`p-5 font-bold ${row.systemAmount && row.fileAmount !== row.systemAmount ? 'text-black underline decoration-dotted' : 'text-black'}`}>
                            {row.fileAmount ? `$${row.fileAmount}` : '-'}
                        </td>
                        <td className="p-5">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                            row.status === 'Matched' ? 'bg-white text-black border-black' :
                            row.status === 'Partial Match' ? 'bg-gray-200 text-black border-transparent' :
                            'bg-black text-white border-black'
                            }`}>
                            {row.status}
                            </span>
                        </td>
                        <td className="p-5 text-sm text-gray-500 max-w-xs truncate" title={row.adminNotes || row.notes}>{row.adminNotes || row.notes}</td>
                        <td className="p-5 text-right">
                            {user.role === 'admin' && row.status !== 'Matched' && (
                            <button onClick={() => handleEditClick(row)} className="text-gray-400 hover:text-black p-2 rounded-full hover:bg-gray-200 transition">
                                <Edit2 size={18} />
                            </button>
                            )}
                        </td>
                        </tr>
                    ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="p-8 text-center text-gray-400 italic">
                                No records match your filters.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
                </div>
            </>
          )}

          {user?.role === 'viewer' && step === 'upload' && (
              <div className="bg-gray-50 p-8 rounded-md border border-gray-300 text-center">
                  <h3 className="text-xl font-bold text-black">Read-Only Mode</h3>
                  <p className="text-gray-600 mt-2">You are logged in as a Viewer. Please check the Audit History tab.</p>
              </div>
          )}

        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-black">Correct Transaction</h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-black">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-black mb-2">Transaction ID</label>
                <div className="p-3 bg-gray-100 rounded-md text-gray-600 font-mono text-sm border border-gray-200">{editRow.transactionID}</div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-black mb-2">Correct Amount</label>
                <input 
                  type="number" 
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none transition"
                  value={formData.newAmount}
                  onChange={(e) => setFormData({...formData, newAmount: parseFloat(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2">Status</label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black outline-none"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Mismatch">Mismatch</option>
                  <option value="Partial Match">Partial Match</option>
                  <option value="Matched">Matched (Force)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2">Audit Note</label>
                <textarea 
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black outline-none"
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Explain why you are changing this..."
                ></textarea>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex gap-3 border-t border-gray-200">
              <button onClick={() => setIsEditing(false)} className="flex-1 py-3 text-black border border-gray-300 font-medium hover:bg-gray-100 rounded-md transition">Cancel</button>
              <button onClick={handleSaveEdit} className="flex-1 py-3 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition flex items-center justify-center gap-2">
                <Save size={18} /> Save Correction
              </button>
            </div>
          </div>
        </div>
      )}

      {isSystemModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-black">Update System Records</h3>
              <button onClick={() => setIsSystemModalOpen(false)} className="text-gray-400 hover:text-black">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 text-center">
               <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                  <Database size={32} className="text-white"/>
               </div>
               <p className="text-gray-600 mb-6">Upload a master CSV file to replace current system records.</p>
               <input 
                  type="file" 
                  accept=".csv"
                  onChange={(e) => setSystemFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 mb-6"
               />
               <button 
                  onClick={handleSystemUpload} 
                  disabled={systemLoading}
                  className="w-full py-3 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition flex items-center justify-center gap-2"
               >
                  {systemLoading ? 'Uploading...' : 'Confirm Upload'}
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;