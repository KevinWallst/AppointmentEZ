'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminIndex() {
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
    
    if (isAuthenticated) {
      // Redirect to dashboard if authenticated
      router.push('/admin/dashboard');
    } else {
      // Redirect to login if not authenticated
      router.push('/admin/login');
    }
  }, [router]);
  
  return null; // This page will redirect, so no need to render anything
}
