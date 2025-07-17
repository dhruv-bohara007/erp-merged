import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  DollarSign, 
  BarChart3, 
  Building2,
  Menu,
  X,
  Building,
  LogOut,
  ShoppingCart,
  Package,
  TrendingUp,
  Moon,
  Sun,
  UserCheck,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const AdminNavigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPurchasesOpen, setIsPurchasesOpen] = useState(false);
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const navItems = [
    { to: '/admin-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/invoices', icon: FileText, label: 'Invoices' },
    { to: '/clients', icon: Users, label: 'Clients' },
    { to: '/suppliers', icon: Building, label: 'Suppliers' },
    { to: '/employees', icon: UserCheck, label: 'Employees' },
    { to: '/inventory', icon: Package, label: 'Products' },  // Changed from 'Product Management'
    { to: '/payments', icon: DollarSign, label: 'Payments' },
    { to: '/reports', icon: BarChart3, label: 'Reports' },
    { to: '/profitability', icon: TrendingUp, label: 'Profitability' },
    { to: '/settings', icon: Building2, label: 'Company Profile' },
  ];

  const purchaseItems = [
    { to: '/purchases?section=purchase-requests', label: 'Purchase Requests' },
    { to: '/purchases?section=purchase-order', label: 'Purchase Order' },
    { to: '/purchases?section=purchase-record', label: 'Purchase Record' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isPurchaseActive = () => {
    return location.pathname === '/purchases';
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
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 pt-5 pb-4">
          <div className="flex items-center flex-shrink-0 px-4">
            <Building className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">InvoiceApp</span>
          </div>
          
          <div className="mt-8 flex-1 flex flex-col">
            {/* Scrollable Navigation */}
            <nav className="flex-1 px-2 space-y-1 overflow-y-auto max-h-[calc(100vh-300px)]">
              {/* Render items up to Products */}
              {navItems.slice(0, 6).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`
                  }
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      isActive(item.to) ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                    }`}
                  />
                  {item.label}
                </NavLink>
              ))}
              
              {/* Purchases Dropdown */}
              <div>
                <button
                  onClick={() => setIsPurchasesOpen(!isPurchasesOpen)}
                  className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isPurchaseActive()
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <ShoppingCart
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      isPurchaseActive() ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                    }`}
                  />
                  Purchases
                  {isPurchasesOpen ? (
                    <ChevronDown className="ml-auto h-4 w-4" />
                  ) : (
                    <ChevronRight className="ml-auto h-4 w-4" />
                  )}
                </button>
                
                {isPurchasesOpen && (
                  <div className="ml-6 mt-1 space-y-1">
                    {purchaseItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className="group flex items-center px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>

              {/* Stock Details */}
              <NavLink
                to="/stock-details"
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                <Package
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    isActive('/stock-details') ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                  }`}
                />
                Inventory
              </NavLink>

              {/* Render remaining items starting from Payments */}
              {navItems.slice(6).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`
                  }
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      isActive(item.to) ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                    }`}
                  />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            
            {/* Fixed Theme Toggle */}
            <div className="flex-shrink-0 px-2 mb-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  {theme === 'light' ? (
                    <Sun className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Moon className="h-4 w-4 text-blue-400" />
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                />
              </div>
            </div>
            
            <div className="flex-shrink-0 px-2 pb-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Logged in as:</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {currentUser?.email}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 capitalize">
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
        <div className="flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">InvoiceApp</span>
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
            <div className="pt-2 pb-3 space-y-1 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Render items up to Products */}
              {navItems.slice(0, 6).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center px-4 py-2 text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-r-4 border-blue-500 dark:border-blue-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`
                  }
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      isActive(item.to) ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                    }`}
                  />
                  {item.label}
                </NavLink>
              ))}
              
              {/* Mobile Purchases Dropdown */}
              <div>
                <button
                  onClick={() => setIsPurchasesOpen(!isPurchasesOpen)}
                  className={`group flex items-center w-full px-4 py-2 text-base font-medium transition-colors ${
                    isPurchaseActive()
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-r-4 border-blue-500 dark:border-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <ShoppingCart
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      isPurchaseActive() ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                    }`}
                  />
                  Purchases
                  {isPurchasesOpen ? (
                    <ChevronDown className="ml-auto h-4 w-4" />
                  ) : (
                    <ChevronRight className="ml-auto h-4 w-4" />
                  )}
                </button>
                
                {isPurchasesOpen && (
                  <div className="ml-8 mt-1 space-y-1">
                    {purchaseItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="group flex items-center px-4 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Stock Details */}
              <NavLink
                to="/stock-details"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center px-4 py-2 text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-r-4 border-blue-500 dark:border-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                <Package
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    isActive('/stock-details') ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                  }`}
                />
                Inventory
              </NavLink>

              {/* Render remaining items starting from Payments */}
              {navItems.slice(6).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center px-4 py-2 text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-r-4 border-blue-500 dark:border-blue-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`
                  }
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      isActive(item.to) ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                    }`}
                  />
                  {item.label}
                </NavLink>
              ))}
              
              {/* Fixed Mobile Theme Toggle */}
              <div className="px-4 pt-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-3">
                  <div className="flex items-center space-x-2">
                    {theme === 'light' ? (
                      <Sun className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <Moon className="h-4 w-4 text-blue-400" />
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                    </span>
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                  />
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Logged in as:</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {currentUser?.email}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 capitalize">
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
