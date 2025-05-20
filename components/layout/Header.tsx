import React from "react";
import { Menu, LogOut, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/UseAuth';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { logout, user } = useAuth();
  
  // Get user display name - prefer full name, fall back to email
  const displayName = user?.user_metadata?.full_name || 
                      user?.user_metadata?.name || 
                      user?.email?.split('@')[0] || 
                      'User';
  
  // Get user email
  const userEmail = user?.email || 'user@example.com';

  // Get initials for avatar
  const initials = displayName
    .split(' ')
    .map((name: string) => name[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    try {
      await logout();
      // Use a more direct approach to ensure redirection works
      document.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      // Still attempt to redirect even if logout fails
      document.location.href = '/';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 w-full flex items-center justify-between px-4 md:px-6">
      {/* Title on the left */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">AI Transformation Assessment</h1>
      </div>

      {/* Right side with help button and user profile */}
      <div className="flex items-center space-x-4">
        {/* Help Button */}
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
        >
          <HelpCircle className="h-5 w-5" />
          <span className="sr-only">Help</span>
        </Button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gray-200 text-gray-700">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header; 