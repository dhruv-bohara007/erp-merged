
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  DollarSign, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Building,
  LogOut
} from 'lucide-react';

const AdminNavigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();

  const navItems = [
    { to: '/admin-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/invoices', icon: FileText, label: 'Invoices' },
    { to: '/clients', icon: Users, label: 'Clients' },
    { to: '/payments', icon: DollarSign, label: 'Payments' },
    { to: '/reports', icon: BarChart3, label: 'Reports' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logout Successful',
        description: 'You have been logged out successfully.',
      });
    } catch (error) {
      toast({
        title: 'Logout Failed',
        description: 'An error occurred during logout',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <Building className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">InvoiceApp</span>
          </div>
          
          <div className="mt-8 flex-1 flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      isActive(item.to) ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            
            {/* User Info and Logout */}
            <div className="flex-shrink-0 px-2 pb-4">
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-500">Logged in as:</p>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentUser?.email}
                </p>
                <p className="text-xs text-blue-600 capitalize">
                  {currentUser?.role?.replace('_', ' ')}
                </p>
              </div>
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-2">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">InvoiceApp</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div className="pt-2 pb-3 space-y-1 bg-white border-b border-gray-200">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center px-4 py-2 text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-900 border-r-4 border-blue-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      isActive(item.to) ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.label}
                </NavLink>
              ))}
              
              <div className="px-4 pt-4 border-t border-gray-200">
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-gray-500">Logged in as:</p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {currentUser?.email}
                  </p>
                  <p className="text-xs text-blue-600 capitalize">
                    {currentUser?.role?.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminNavigation;
