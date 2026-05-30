import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verifying...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('Invalid verification link.');
      return;
    }
    // Call backend verification endpoint
    fetch(`/api/verify?token=${token}`)
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
      .catch(() => setStatus('Network error during verification.'));
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
