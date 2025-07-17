
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CreditCard, 
  Settings, 
  Package,
  Building2,
  TrendingUp,
  BarChart3,
  ShoppingCart,
  Truck,
  Calculator,
  UserCheck,
  Archive
} from 'lucide-react';

const AdminNavigation = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: LayoutDashboard 
    },
    { 
      name: 'Clients', 
      path: '/dashboard/clients', 
      icon: Users 
    },
    { 
      name: 'Invoices', 
      path: '/dashboard/invoices', 
      icon: FileText 
    },
    { 
      name: 'Payments', 
      path: '/dashboard/payments', 
      icon: CreditCard 
    },
    { 
      name: 'Reports', 
      path: '/dashboard/reports', 
      icon: BarChart3 
    },
    { 
      name: 'Products', 
      path: '/dashboard/inventory', 
      icon: Package 
    },
    { 
      name: 'Inventory Management', 
      path: '/dashboard/stock-details', 
      icon: Archive 
    },
    { 
      name: 'Purchase Management', 
      path: '/dashboard/purchases', 
      icon: ShoppingCart 
    },
    { 
      name: 'Purchase Requests', 
      path: '/dashboard/purchase-requests', 
      icon: UserCheck 
    },
    { 
      name: 'Suppliers', 
      path: '/dashboard/suppliers', 
      icon: Truck 
    },
    { 
      name: 'Employees', 
      path: '/dashboard/employees', 
      icon: UserCheck 
    },
    { 
      name: 'Company Profile', 
      path: '/dashboard/company', 
      icon: Building2 
    },
    { 
      name: 'Settings', 
      path: '/dashboard/settings', 
      icon: Settings 
    }
  ];

  return (
    <nav className="mt-8">
      <div className="px-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Menu
        </h2>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `
                    group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`
                    mr-3 h-5 w-5 transition-colors duration-200
                    ${isActive(item.path) ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-600'}
                  `} />
                  {item.name}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default AdminNavigation;
