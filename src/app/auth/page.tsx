'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Sign up the user with metadata including name
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0], // Store name in auth.users metadata
          }
        }
      });
      
      if (signUpError) throw signUpError;

      // If signup successful, create user profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            { 
              id: authData.user.id,
              email: authData.user.email,
              name: name || email.split('@')[0], // Use name if provided, otherwise use email username
              risk_tolerance: 'moderate', // default value
              portfolio_value: 0, // default starting value
            }
          ]);
          
        if (profileError) {
          console.error('Error creating user profile:', profileError);
          throw new Error('Failed to create user profile: ' + profileError.message);
        }
        
        alert('Check your email for the confirmation link!');
        // Clear the form after successful signup
        setEmail('');
        setPassword('');
        setName('');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during sign up');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Successful login
      console.log('Successfully logged in:', data);
      router.push('/');
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
        <div className="bg-white p-8 rounded shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6">Fixed Income Tracker</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                type="submit"
                onClick={handleSignIn}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {loading ? 'Loading...' : 'Sign In'}
              </button>
              
              <button
                type="button"
                onClick={handleSignUp}
                disabled={loading}
                className="flex-1 py-2 px-4 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
