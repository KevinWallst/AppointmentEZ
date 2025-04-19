'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TestPage from '../../components/TestPage';

export default function AdminTestPage() {
  const router = useRouter();

  // Check if user is logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminAuthenticated') === 'true';
    if (!isLoggedIn) {
      router.push('/admin/login');
    }
  }, [router]);

  return (
    <div style={{
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      padding: '1.5rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>AppointmentEZ</h1>
            <h3 style={{ color: '#666' }}>System Test Suite</h3>
          </div>
          <button
            onClick={() => router.push('/admin/dashboard')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'white',
              color: '#1976d2',
              border: '1px solid #1976d2',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Back to Dashboard
          </button>
        </div>

        <TestPage />
      </div>
    </div>
  );
}
