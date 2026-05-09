import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  LayoutDashboard, 
  ShieldCheck, 
  LogOut, 
  Search, 
  Calendar, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Package,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, differenceInDays } from 'date-fns';

// Types
interface Tool {
  ToolID: number;
  Name: string;
  Category: string;
  DailyRate: number;
  BuyPrice: number;
  Deposit: number;
  Status: 'Available' | 'Rented' | 'Maintenance';
  ImageURL: string;
}

interface Rental {
  RentalID: number;
  ToolID: number;
  UserID: number;
  StartDate: string;
  EndDate: string;
  TotalFee: number;
  RentalStatus: 'Active' | 'Completed' | 'Overdue';
  Name: string;
  ImageURL: string;
}

// Components
const Navbar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Wrench className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">AURORA</h1>
            <p className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase mt-1">Artisan Library</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          {[
            { id: 'marketplace', label: 'Explore', icon: Search },
            { id: 'dashboard', label: 'My Library', icon: LayoutDashboard },
            { id: 'admin', label: 'Admin', icon: ShieldCheck },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 text-sm font-medium transition-all duration-300 ${
                activeTab === item.id ? 'text-white translate-y-[-2px]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-indigo-400' : ''}`} />
              {item.label}
              {activeTab === item.id && (
                <motion.div layoutId="nav-glow" className="absolute -bottom-7 left-0 right-0 h-1 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right pr-4 border-r border-white/10">
            <p className="text-xs font-semibold text-white">M. Hammad</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Artisan Pro</p>
          </div>
          <button className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

const Marketplace = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [days, setDays] = useState(1);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isAvailable, setIsAvailable] = useState(true);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/tools').then(res => res.json()).then(setTools);
  }, []);

  useEffect(() => {
    if (selectedTool) {
      setChecking(true);
      const endDate = new Date(new Date(startDate).getTime() + days * 86400000).toISOString().split('T')[0];
      fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: selectedTool.ToolID, startDate, endDate })
      })
      .then(res => res.json())
      .then(data => {
        setIsAvailable(data.available);
        setChecking(false);
      });
    }
  }, [selectedTool, days, startDate]);

  const handleRent = async () => {
    if (!selectedTool || !isAvailable) return;
    setLoading(true);
    try {
      const res = await fetch('/api/rent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1, toolId: selectedTool.ToolID, days, startDate })
      });
      if (res.ok) {
        setSelectedTool(null);
        fetch('/api/tools').then(res => res.json()).then(setTools);
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 pb-12 px-6 max-w-7xl mx-auto">
      <div className="mb-12">
        <h2 className="text-4xl font-bold text-white mb-2 tracking-tight flex items-center gap-4">
          Artisan Inventory 
          <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/50 to-transparent ml-4" />
        </h2>
        <p className="text-gray-400 max-w-2xl">Precision tools for modern craftsmanship. From high-end jewelry rolling mills to industrial CNC machines.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tools.map((tool) => (
          <motion.div
            layout
            key={tool.ToolID}
            whileHover={{ y: -5 }}
            className="group relative bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden hover:border-indigo-500/50 transition-all duration-500 shadow-2xl"
          >
            <div className="aspect-[4/5] overflow-hidden">
              <img 
                src={tool.ImageURL} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 brightness-75 group-hover:brightness-100" 
                alt={tool.Name}
              />
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-lg border ${
                  tool.Status === 'Available' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                }`}>
                  {tool.Status}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-mono uppercase text-indigo-400">{tool.Category}</p>
                <p className="text-[10px] font-mono text-gray-500">ID: AUR-{tool.ToolID}</p>
              </div>
              <h3 className="text-lg font-bold text-white mb-4 line-clamp-1 group-hover:text-indigo-400 transition-colors">{tool.Name}</h3>
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Daily Rate</p>
                  <p className="text-white font-bold text-xl">${tool.DailyRate}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Deposit</p>
                  <p className="text-white font-medium">${tool.Deposit}</p>
                </div>
              </div>

              <button
                disabled={tool.Status !== 'Available'}
                onClick={() => setSelectedTool(tool)}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 ${
                  tool.Status === 'Available'
                    ? 'bg-white text-black hover:bg-indigo-500 hover:text-white shadow-xl group-hover:shadow-indigo-500/20'
                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                }`}
              >
                {tool.Status === 'Available' ? 'Reserve Artifact' : 'Currently Rented'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedTool && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedTool(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-[40px] p-10 max-w-lg w-full shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
              
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white leading-tight underline decoration-indigo-500/30 underline-offset-8">Configure Rental</h3>
                  <p className="text-gray-400 text-sm mt-3">{selectedTool.Name}</p>
                </div>
                <button onClick={() => setSelectedTool(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-3">Target Start Date</label>
                  <input 
                    type="date"
                    min={format(new Date(), 'yyyy-MM-dd')}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-3">Rental Duration (Days)</label>
                  <div className="flex items-center gap-6 p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <input 
                      type="range" 
                      min="1" max="30" 
                      value={days} 
                      onChange={(e) => setDays(parseInt(e.target.value))}
                      className="flex-1 accent-indigo-500"
                    />
                    <span className="text-2xl font-bold text-white w-12 text-center">{days}</span>
                  </div>
                </div>

                <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Rate Allocation (${selectedTool.DailyRate} × {days})</span>
                    <span className="text-white font-medium">${selectedTool.DailyRate * days}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Security Escrow</span>
                    <span className="text-white font-medium">${selectedTool.Deposit}</span>
                  </div>
                  <div className="pt-3 border-t border-white/5 flex justify-between">
                    <span className="text-white font-bold">Total Artifact Fee</span>
                    <span className="text-indigo-400 font-bold text-xl">${(selectedTool.DailyRate * days) + selectedTool.Deposit}</span>
                  </div>
                </div>

                {!isAvailable && !checking && (
                  <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-400 shrink-0" />
                    <p className="text-xs text-orange-200">This artifact is already reserved for the selected cycle. Please adjust your calendar.</p>
                  </div>
                )}

                <button
                  onClick={handleRent}
                  disabled={loading || !isAvailable || checking}
                  className={`w-full py-5 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-3 ${
                    isAvailable && !checking
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                      : 'bg-white/5 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Transcribing DBMS Entry...' : checking ? 'Pinging Relational Index...' : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      Commit to Transaction
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Identity Verified: M. Hammad (U123456)</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Dashboard = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);

  const fetchRentals = () => {
    fetch('/api/rentals/1').then(res => res.json()).then(setRentals);
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  const handleReturn = async (rentalId: number) => {
    if (!confirm("Are you sure you want to return this artifact to the library?")) return;
    const res = await fetch('/api/return', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rentalId })
    });
    if (res.ok) {
      fetchRentals();
    }
  };

  return (
    <div className="pt-28 pb-12 px-6 max-w-7xl mx-auto">
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">Personal Library</h2>
          <p className="text-gray-400">Real-time status of your artisan equipment stack.</p>
        </div>
        <div className="flex gap-3">
           <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Active Rentals</p>
              <p className="text-3xl font-bold text-white">{rentals.filter(r => r.RentalStatus === 'Active').length}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rentals.map((rental) => {
          const daysLeft = differenceInDays(new Date(rental.EndDate), new Date());
          return (
            <motion.div 
              key={rental.RentalID}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-white/[0.03] border border-white/5 rounded-[32px] p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-indigo-500/30 transition-all"
            >
              <div className="w-full md:w-40 aspect-square rounded-2xl overflow-hidden">
                <img src={rental.ImageURL} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Artifact</p>
                  <h4 className="text-white font-bold text-lg">{rental.Name}</h4>
                  <p className="text-indigo-400 text-xs font-mono">{rental.Category}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Return Period</p>
                  <div className="flex items-center gap-2 text-white font-mono text-sm">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    {format(new Date(rental.EndDate), 'MMM dd, yyyy')}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${rental.RentalStatus === 'Active' ? 'bg-indigo-500 animate-pulse' : 'bg-gray-500'}`} />
                    <span className="text-white font-bold text-sm">{rental.RentalStatus}</span>
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  {rental.RentalStatus === 'Active' && (
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Time Left</p>
                        <p className={`text-xl font-bold ${daysLeft < 2 ? 'text-orange-500' : 'text-white'}`}>
                          {daysLeft < 0 ? 'Overdue' : `${daysLeft} Days`}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleReturn(rental.RentalID)}
                        className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-bold uppercase tracking-widest rounded-full transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                      >
                        Return Tool
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        {rentals.length === 0 && (
          <div className="py-24 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-[40px]">
            <Package className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No tools in your possession yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Admin = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/stats').then(res => res.json()).then(setStats);
  }, []);

  if (!stats) return <div className="pt-28 text-center text-gray-400 px-6">Loading Artisan Intelligence...</div>;

  return (
    <div className="pt-28 pb-12 px-6 max-w-7xl mx-auto">
      <div className="mb-12">
        <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">Admin Vault</h2>
        <p className="text-gray-400">Fleet analytics and relational integrity monitor.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[40px] shadow-2xl shadow-indigo-600/20 overflow-hidden relative group">
          <TrendingUp className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 group-hover:scale-110 transition-transform duration-700" />
          <p className="text-indigo-100/60 text-[11px] font-bold uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="text-5xl font-black text-white">${stats.totalRevenue.toLocaleString()}</p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] text-white">
            <CheckCircle2 className="w-3 h-3" /> Relational Balance: OK
          </div>
        </div>
        
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/5 p-8 rounded-[40px]">
          <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-1">Active Fleet Usage</p>
          <p className="text-5xl font-black text-white">{stats.activeRentals}</p>
          <p className="mt-4 text-xs text-indigo-400 font-medium tracking-tight">Currently being handled by artisans</p>
        </div>

        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/5 p-8 rounded-[40px]">
          <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-1">Fleet Compliance</p>
          <p className={`text-5xl font-black ${stats.overdueRentals.length > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
            {100 - (stats.overdueRentals.length * 5)}%
          </p>
          <p className="mt-4 text-xs text-gray-400 font-medium">{stats.overdueRentals.length} overdue artifacts detected</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px]">
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
            <TrendingUp className="text-indigo-400" /> Artisan Demand Index
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.popularTools}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis 
                  dataKey="Name" 
                  stroke="#555" 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '16px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {stats.popularTools.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#312e81'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px]">
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
            <AlertCircle className="text-orange-500" /> Compliance Monitor
          </h3>
          <div className="space-y-4">
            {stats.overdueRentals.map((r: any) => (
              <div key={r.RentalID} className="flex items-center justify-between p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl group/item transition-all hover:bg-orange-500/10">
                <div>
                  <p className="text-white font-bold text-sm group-hover/item:text-orange-400 transition-colors">{r.Name}</p>
                  <p className="text-[10px] text-orange-400/60 font-mono">EXPIRED: {format(new Date(r.EndDate), 'MMM dd, yyyy')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 font-mono mb-1">RENTAL_ID: {r.RentalID}</p>
                  <button 
                    onClick={async () => {
                      if (!confirm("Revoke access for this overdue artifact?")) return;
                      const res = await fetch('/api/return', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rentalId: r.RentalID })
                      });
                      if (res.ok) {
                        fetch('/api/admin/stats').then(res => res.json()).then(setStats);
                      }
                    }}
                    className="text-[9px] bg-orange-500 hover:bg-orange-400 text-white px-3 py-1.5 rounded-full font-bold uppercase tracking-wider transition-all active:scale-95"
                  >
                    Force Return
                  </button>
                </div>
              </div>
            ))}
            {stats.overdueRentals.length === 0 && (
              <div className="py-20 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500/20 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">System integrity optimal. All items synced.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('marketplace');

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-indigo-500/30">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="relative">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-600/10 blur-[120px] rounded-full" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTab === 'marketplace' && <Marketplace />}
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'admin' && <Admin />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
