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
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full min-h-screen">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Dumbbell className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">FitMate</h2>
            <p className="text-orange-500 text-[10px] font-bold uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
        {sections.map((section) => (
          <div key={section}>
            <h3 className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
              {section}
            </h3>
            <div className="space-y-1.5">
              {navItems
                .filter((item) => item.section === section)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onChangeTab(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isActive
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                      <span className="font-semibold text-sm">{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-xs">
              A
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">Admin User</p>
              <p className="text-[10px] text-gray-500 truncate">Super Admin</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
