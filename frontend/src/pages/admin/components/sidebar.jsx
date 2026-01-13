import { 
  Users, DollarSign, Dumbbell, Calendar, MessageCircle, 
  Home, UserPlus, CreditCard, Clock, TrendingUp, Package,
  Shield, User, Settings, LayoutDashboard, Users2, 
  ClipboardList, Activity, Bell, LogOut
} from 'lucide-react'

const navItems = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, section: 'Main' },
  { id: 'billing', label: 'Billing & Finance', icon: DollarSign, section: 'Main' },
  { id: 'trainers', label: 'Trainers', icon: UserPlus, section: 'Management' },
  { id: 'trainees', label: 'Trainees', icon: Users2, section: 'Management' },
  { id: 'membership', label: 'Membership Plans', icon: CreditCard, section: 'Management' },
  { id: 'equipment', label: 'Equipment', icon: Dumbbell, section: 'Management' },
  { id: 'schedule', label: 'Gym Schedule', icon: Calendar, section: 'Management' },
  { id: 'messages', label: 'Messages', icon: MessageCircle, section: 'Communication' },
  { id: 'users', label: 'System Users', icon: Shield, section: 'Settings' },
  { id: 'profile', label: 'My Profile', icon: User, section: 'Settings' },
  { id: 'settings', label: 'System Settings', icon: Settings, section: 'Settings' },
]

const Sidebar = ({ activeTab, onChangeTab }) => {
  const sections = ['Main', 'Management', 'Communication', 'Settings'];

  return (
    <aside className="w-64 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 flex flex-col h-full min-h-screen">
      {/* Sidebar Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <Dumbbell className="text-white w-6 h-6 transform -rotate-45" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              Fit<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">Mate</span>
            </h2>
            <p className="text-slate-400 text-[10px] font-medium tracking-wide">ADMIN DASHBOARD</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto custom-scrollbar">
        {sections.map((section) => (
          <div key={section}>
            <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-slate-600"></span>
              {section}
            </h3>
            <div className="space-y-1">
              {navItems
                .filter((item) => item.section === section)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onChangeTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 text-white border border-indigo-500/30 shadow-lg shadow-indigo-500/5'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:border hover:border-slate-700/50'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 animate-pulse"></div>
                      )}
                      <Icon className={`w-4 h-4 flex-shrink-0 relative z-10 ${isActive ? 'text-indigo-400' : 'group-hover:text-indigo-400'}`} />
                      <span className="font-medium text-sm truncate relative z-10">{item.label}</span>
                      {isActive && (
                        <div className="ml-auto relative z-10">
                          <div className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full animate-pulse" />
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 rounded-xl p-3.5 border border-slate-700/50 hover:border-slate-600/50 transition-all cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                A
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-800"></div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">Admin User</p>
              <p className="text-[10px] text-slate-400 truncate">Super Admin</p>
            </div>
            <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors" />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
