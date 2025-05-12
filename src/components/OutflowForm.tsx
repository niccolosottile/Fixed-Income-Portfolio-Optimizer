'use client';

import { useState } from 'react';
import { CurrencyCode, CURRENCIES, LiquidityEvent } from '@/types';
import { parseInputValue, formatNumberWithCommas } from '@/lib/utils';

interface OutflowFormProps {
  userId: string;
  userCurrency: CurrencyCode;
  onEventAdded: (event: LiquidityEvent | null) => void;
}

export default function OutflowForm({ userId, userCurrency, onEventAdded }: OutflowFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(userCurrency);
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  
  // Predefined outflow categories for quick selection
  const outflowCategories = [
    { id: 'large-purchase', name: 'Large Purchase', icon: '🛒' },
    { id: 'home-payment', name: 'Home/Mortgage', icon: '🏠' },
    { id: 'car-payment', name: 'Car/Vehicle', icon: '🚗' },
    { id: 'education', name: 'Education', icon: '🎓' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
    { id: 'taxes', name: 'Taxes', icon: '📝' },
    { id: 'vacation', name: 'Vacation', icon: '✈️' },
    { id: 'emergency', name: 'Emergency Fund', icon: '🆘' },
    { id: 'other', name: 'Other', icon: '📋' },
  ];
  
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const selectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const category = outflowCategories.find(c => c.id === categoryId);
    if (category) {
      setDescription(category.name);
    }
  };
  
  const handleCurrencyInput = (value: string) => {
    // Remove all non-numeric characters except decimal points when processing input
    const parsedValue = parseInputValue(value);
    setAmount(parsedValue !== 0 ? parsedValue.toString() : '');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    
    try {
      if (!amount || !currency || !date || !description) {
        throw new Error('Please fill out all required fields');
      }
      
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error('Please enter a valid positive amount');
      }
      
      const eventDate = new Date(date);
      if (eventDate < new Date()) {
        throw new Error('Please select a future date');
      }
      
      // Create the event object
      const newEvent: Omit<LiquidityEvent, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        amount: numericAmount,
        currency: currency,
        date: date,
        description: description
      };
      
      // Make API call to create the event
      const response = await fetch('/api/liquidity-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEvent),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create liquidity event');
      }
      
      const createdEvent = await response.json();
      onEventAdded(createdEvent);
      
    } catch (error) {
      console.error('Error creating liquidity event:', error);
      setFormError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="overflow-y-auto">
      {formError && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-md text-red-800 dark:text-red-300">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Error:</span>
          </div>
          <p className="ml-7 mt-1">{formError}</p>
        </div>
      )}
      
      <div className="space-y-6">
        <div className="form-section bg-slate-200 dark:bg-gray-800">
          <h3 className="form-section-title flex items-center">
            <span className="icon-container icon-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
            </span>
            Outflow Category
          </h3>
          
          <div className="mt-4 grid grid-cols-3 gap-2">
            {outflowCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => selectCategory(category.id)}
                className={`flex flex-col items-center justify-center p-2 border rounded-md text-sm transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <span className="text-xl mb-1">{category.icon}</span>
                <span className="text-xs">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="form-section bg-slate-200 dark:bg-gray-800">
          <h3 className="form-section-title flex items-center">
            <span className="icon-container icon-sm mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </span>
            Outflow Details
          </h3>
          
          <div className="space-y-4 mt-4">
            <div>
              <label htmlFor="description" className="form-label">
                Description <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input"
                placeholder="E.g., Home down payment, Car purchase, etc."
                required
              />
            </div>
            
            <div className="form-row">
              <div>
                <label htmlFor="amount" className="form-label">
                  Amount <span className="text-rose-500">*</span>
                </label>
                <div className="currency-input-container">
                  <div className="currency-symbol">
                    {CURRENCIES.find(c => c.code === currency)?.code || currency}
                  </div>
                  <input
                    type="text"
                    id="amount"
                    value={amount ? formatNumberWithCommas(amount) : ''}
                    onChange={(e) => handleCurrencyInput(e.target.value)}
                    className="currency-input flex-grow text-gray-800 dark:text-gray-200"
                    placeholder="0.00"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enter the amount needed for this expense.
                </p>
              </div>
              
              <div>
                <label htmlFor="date" className="form-label">
                  Expected Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="form-input date-input"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  When will you need this money?
                </p>
              </div>
            </div>
            
            <div>
              <label htmlFor="currency" className="form-label">
                Currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="form-select"
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.name} ({curr.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="modal-footer mt-6">
        <button
          type="button"
          onClick={() => onEventAdded(null)}
          className="btn-secondary h-9 w-24 text-sm"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary h-9 w-32 flex items-center justify-center text-sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <span className="icon-container icon-xs mr-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </span>
              Add Outflow
            </>
          )}
        </button>
      </div>
    </form>
  );
}