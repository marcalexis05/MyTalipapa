import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verifying...');
  
  // Use a ref to ensure we only execute the API call once per mount cycle
  const hasFetched = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('Invalid verification link.');
      return;
    }

    // Prevents StrictMode double-firing in development
    if (hasFetched.current) return;
    hasFetched.current = true;

    // Use AbortController to cancel the request if component unmounts mid-flight
    const controller = new AbortController();
    const { signal } = controller;

    fetch(`/api/verify?token=${token}`, { signal })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus(data.message || 'Email verified successfully!');
          // Redirect to login after short delay
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setStatus(data.error || 'Verification failed.');
        }
      })
      .catch((err) => {
        // Don't update state if the error was a deliberate fetch cancellation
        if (err.name !== 'AbortError') {
          setStatus('Network error during verification.');
        }
      });

    // Cleanup function
    return () => {
      controller.abort();
    };
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="p-6 bg-white rounded-xl shadow-md text-center">
        <h2 className="text-2xl font-semibold mb-4">Email Verification</h2>
        <p className="text-gray-700">{status}</p>
      </div>
    </div>
  );
};

export default VerifyEmail;