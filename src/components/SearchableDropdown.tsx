
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Edit2, Trash2, ChevronDown } from 'lucide-react';

interface SearchableDropdownProps {
  items: string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  onEdit?: (item: string) => void;
  onDelete?: (item: string) => void;
  showActions?: boolean;
}

const SearchableDropdown = ({ 
  items, 
  value, 
  onValueChange, 
  placeholder = "Select item...", 
  onEdit, 
  onDelete, 
  showActions = false 
}: SearchableDropdownProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredItems = items.filter(item =>
    item && typeof item === 'string' && item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {value || placeholder}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full min-w-[200px] bg-background border shadow-md z-50">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="max-h-48 overflow-y-auto">
          {filteredItems.map((item) => (
            <DropdownMenuItem
              key={item}
              onSelect={() => {
                onValueChange(item);
                setIsOpen(false);
                setSearchTerm('');
              }}
              className="flex justify-between items-center hover:bg-accent hover:text-accent-foreground"
            >
              <span className="flex-1">{item}</span>
              {showActions && (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => onEdit(item)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      onClick={() => onDelete(item)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </DropdownMenuItem>
          ))}
          {filteredItems.length === 0 && (
            <div className="p-2 text-center text-muted-foreground text-sm">
              No items found
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SearchableDropdown;
