import { 
  Users, DollarSign, Dumbbell, Calendar, MessageCircle, 
  Home, UserPlus, CreditCard, Clock, TrendingUp, Package,
  Shield, User, Settings, LayoutDashboard, Users2, 
  ClipboardList, Activity, Bell, LogOut, Moon, Sun
} from 'lucide-react'
import { useTheme } from '../../../contexts/ThemeContext'

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

const Sidebar = ({ activeTab, onChangeTab, unreadMessageCount = 0, onClearMessageBadge }) => {
  const { isDark, toggleTheme } = useTheme()
  const sections = ['Main', 'Management', 'Communication', 'Settings'];

  const handleNavClick = (itemId) => {
    onChangeTab(itemId)
    // Clear message badge when navigating to messages
    if (itemId === 'messages' && unreadMessageCount > 0 && onClearMessageBadge) {
      onClearMessageBadge()
    }
  }

  return (
    <aside className={`w-64 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r flex flex-col h-full min-h-screen`}>
      {/* Sidebar Header */}
      <div className={`p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <Dumbbell className="text-white w-6 h-6 transform -rotate-45" />
            </div>
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 ${isDark ? 'border-gray-800' : 'border-white'}`}></div>
          </div>
          <div>
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} tracking-wide`}>
              FitMate
            </h2>
            <p className={`text-[10px] font-medium tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>ADMIN DASHBOARD</p>
          </div>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 ${
            isDark 
              ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <div className="flex items-center gap-3">
            {isDark ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span className="text-sm font-medium">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <div className={`w-10 h-5 rounded-full relative transition-colors ${isDark ? 'bg-indigo-500' : 'bg-amber-400'}`}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isDark ? 'left-5' : 'left-0.5'}`}></div>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto custom-scrollbar">
        {sections.map((section) => (
          <div key={section}>
            <h3 className={`px-3 text-[11px] font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {section}
            </h3>
            <div className="space-y-1">
              {navItems
                .filter((item) => item.section === section)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const showBadge = item.id === 'messages' && unreadMessageCount > 0;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? isDark
                            ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : isDark
                            ? 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? (isDark ? 'text-indigo-400' : 'text-indigo-600') : ''}`} />
                      <span className="font-medium text-sm truncate">{item.label}</span>
                      {showBadge ? (
                        <div className="ml-auto flex items-center gap-1">
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded-full min-w-[18px] text-center">
                            {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                          </span>
                        </div>
                      ) : isActive ? (
                        <div className="ml-auto">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                        </div>
                      ) : null}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`rounded-xl p-3.5 border transition-all cursor-pointer group ${
          isDark 
            ? 'bg-gray-700/30 border-gray-700 hover:border-gray-600' 
            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                A
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 ${isDark ? 'border-gray-800' : 'border-white'}`}></div>
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>Admin User</p>
              <p className={`text-[10px] truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Super Admin</p>
            </div>
            <LogOut className={`w-4 h-4 transition-colors ${isDark ? 'text-gray-500 group-hover:text-red-400' : 'text-gray-400 group-hover:text-red-500'}`} />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
