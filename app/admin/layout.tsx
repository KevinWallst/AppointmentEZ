'use client';
import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // Skip authentication check for the login page
    if (pathname === '/admin/login') {
      return;
    }
    
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
    
    if (!isAuthenticated) {
      // Redirect to login page if not authenticated
      router.push('/admin/login');
    }
  }, [pathname, router]);
  
  return (
    <div>
      {children}
    </div>
  );
}
