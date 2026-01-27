import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, X, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTeamUsers, TeamUser } from '@/hooks/useTeamUsers';

interface UserSelectProps {
  value?: string | null;
  onValueChange: (userId: string | null) => void;
  excludeIds?: string[];
  disabled?: boolean;
  placeholder?: string;
}

export function UserSelect({
  value,
  onValueChange,
  excludeIds = [],
  disabled = false,
  placeholder = 'Search user by email...',
}: UserSelectProps) {
  const [open, setOpen] = useState(false);
  const { users, isLoading } = useTeamUsers();

  const availableUsers = useMemo(() => {
    return users.filter(user => !excludeIds.includes(user.id));
  }, [users, excludeIds]);

  const selectedUser = useMemo(() => {
    return users.find(user => user.id === value);
  }, [users, value]);

  const handleSelect = (userId: string) => {
    if (userId === value) {
      onValueChange(null);
    } else {
      onValueChange(userId);
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || isLoading}
        >
          {selectedUser ? (
            <span className="flex items-center gap-2 truncate">
              <UserPlus className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">
                {selectedUser.email || selectedUser.full_name || 'Unknown user'}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {selectedUser && (
              <X
                className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by email or name..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Loading...' : 'No users found.'}
            </CommandEmpty>
            <CommandGroup>
              {availableUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`${user.email || ''} ${user.full_name || ''}`}
                  onSelect={() => handleSelect(user.id)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === user.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{user.email || 'No email'}</span>
                    {user.full_name && (
                      <span className="text-xs text-muted-foreground">
                        {user.full_name}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
