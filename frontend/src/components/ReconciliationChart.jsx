// src/components/ReconciliationChart.jsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ReconciliationChart = ({ report }) => {
  if (!report) return null;
  const data = [
    { name: 'Matched', value: report.filter(r => r.status === 'Matched').length, color: '#10B981' },
    { name: 'Partial', value: report.filter(r => r.status === 'Partial Match').length, color: '#F59E0B' },
    { name: 'Mismatch', value: report.filter(r => r.status === 'Mismatch').length, color: '#EF4444' },
    { name: 'Unmatched', value: report.filter(r => r.status === 'Unmatched').length, color: '#6B7280' },
  ].filter(item => item.value > 0);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80 flex flex-col items-center justify-center">
      <h3 className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-4 w-full text-left">Reconciliation Status</h3>
      
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ReconciliationChart;