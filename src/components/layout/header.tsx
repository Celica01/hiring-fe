'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Users, Briefcase, Home, Plus, LogOut, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { CreateJobModal } from '@/components/create-job-modal';

export function Navigation() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return null;

  // Define navigation based on role
  const navigation = user?.role === 'admin'
    ? [
        { name: 'Dashboard', href: '/', icon: Home },
        { name: 'Jobs', href: '/jobs', icon: Briefcase },
      ]
    : [
        { name: 'Jobs', href: '/jobs', icon: Briefcase },
      ];

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {navigation.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            'flex items-center text-sm font-medium transition-colors hover:text-primary',
            pathname === item.href
              ? 'text-black dark:text-white'
              : 'text-muted-foreground'
          )}
        >
          <item.icon className="mr-2 h-4 w-4" />
          {item.name}
        </Link>
      ))}
    </nav>
  );
}

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Don't show header on login page
  if (pathname === '/login') return null;

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4">
        <Link href="/" className="flex items-center space-x-2">
          <Briefcase className="h-6 w-6" />
          <span className="font-bold text-xl">Hiring App</span>
        </Link>
        <div className="ml-auto flex items-center space-x-4">
          <Navigation />
          {isAuthenticated && (
            <div className="flex items-center space-x-2">
              {user?.role === 'admin' ? (
                <>
                  <Button size="sm" onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Job
                  </Button>
                  <CreateJobModal open={isModalOpen} onOpenChange={setIsModalOpen} />
                </>
              ) : null}
              
              <div className="flex items-center space-x-2 px-3 py-1 bg-muted rounded-md">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{user?.name || user?.email}</span>
                <span className="text-xs text-muted-foreground">({user?.role})</span>
              </div>
              
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}