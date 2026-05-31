import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verifying...');
  

  const hasFetched = useRef(false);

  useEffect(() => {
    // 1. Extract the token from the URL (?token=...)
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('Invalid verification link.');
      return;
    }

    // 2. Guard against double-firing
    if (hasFetched.current) return;
    hasFetched.current = true;

    // 3. Setup AbortController for clean unmounting
    const controller = new AbortController();
    const { signal } = controller;

    // 4. Hit the backend API endpoint
    fetch(`/api/verify?token=${token}`, { signal })
      .then(async (res) => {
        const data = await res.json();
        
        if (res.ok) {
          setStatus(data.message || 'Email verified successfully!');
          // Redirect to login page after 3 seconds
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setStatus(data.error || 'Verification failed.');
        }
      })
      .catch((err) => {
        // Prevent state update if the component unmounted and aborted deliberately
        if (err.name !== 'AbortError') {
          setStatus('Network error during verification.');
        }
      });

    // 5. Cleanup on unmount
    return () => {
      controller.abort();
    };
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="p-6 bg-white rounded-xl shadow-md text-center max-w-sm w-full mx-4">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Email Verification</h2>
        <p className="text-gray-600 font-medium">{status}</p>
      </div>
    </div>
  );
};

export default VerifyEmail;