'use client';
import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

// Custom form validation hook
function useAuthForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const validateForm = useCallback(() => {
    const newErrors: {
      email?: string;
      password?: string;
    } = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  return {
    formData,
    errors,
    loading,
    setLoading,
    validateForm,
    handleInputChange,
    setErrors
  };
}

export default function Auth() {
  const {
    formData,
    errors,
    loading,
    setLoading,
    validateForm,
    handleInputChange,
    setErrors
  } = useAuthForm();
  
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name || formData.email.split('@')[0],
          }
        }
      });
      
      if (signUpError) throw signUpError;
      
      // If signup successful, create user profile
      if (data.user) {
        // Set default currency and country
        const defaultCurrency = 'EUR';
        const defaultCountry = 'eurozone';
        
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            { 
              id: data.user.id,
              email: data.user.email,
              name: formData.name || formData.email.split('@')[0],
              risk_tolerance: 'moderate',
              portfolio_value: 0,
              currency: defaultCurrency,
              country: defaultCountry
            }
          ]);
          
        if (profileError) {
          throw new Error('Failed to create user profile: ' + profileError.message);
        }
        
        alert('Check your email for the confirmation link!');
        // Clear the form
        handleInputChange({ target: { name: 'email', value: '' } } as React.ChangeEvent<HTMLInputElement>);
        handleInputChange({ target: { name: 'password', value: '' } } as React.ChangeEvent<HTMLInputElement>);
        handleInputChange({ target: { name: 'name', value: '' } } as React.ChangeEvent<HTMLInputElement>);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign up';
      setErrors(prev => ({ ...prev, form: errorMessage }));
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) throw error;
      
      router.push('/');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid login credentials';
      setErrors(prev => ({ ...prev, form: errorMessage }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <main className="flex w-full flex-1 flex-col items-center justify-center px-4 sm:px-20 text-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-md flex items-center justify-center text-white font-bold mr-2">FI</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fixed Income Portfolio</h1>
          </div>
          
          {errors.form && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md mb-6">
              {errors.form}
            </div>
          )}
          
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`form-input w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white`}
                required
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`form-input w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white`}
                required
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name (optional)</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                onClick={handleSignIn}
                disabled={loading}
                className="flex-1 btn-primary disabled:opacity-50 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 font-medium"
              >
                {loading ? 'Loading...' : 'Sign In'}
              </button>
              
              <button
                type="button"
                onClick={handleSignUp}
                disabled={loading}
                className="flex-1 btn-outline disabled:opacity-50 border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-md hover:bg-indigo-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 font-medium"
              >
                Sign Up
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
              Return to home page
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
