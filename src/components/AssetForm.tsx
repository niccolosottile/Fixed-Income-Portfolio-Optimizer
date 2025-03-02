'use client';

import { useState } from 'react';
import { FixedIncomeAsset } from '@/types';
import axios from 'axios';

interface AssetFormProps {
  userId: string;
  onAssetAdded: (asset: FixedIncomeAsset) => void;
}

export default function AssetForm({ userId, onAssetAdded }: AssetFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_id: userId,
    type: 'bond',
    name: '',
    purchase_date: '',
    maturity_date: '',
    face_value: 0,
    purchase_price: 0,
    interest_rate: 0,
    interest_payment_frequency: 'semiannual',
    rating: '',
    taxable: true
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' 
          ? parseFloat(value) 
          : value
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/assets', formData);
      onAssetAdded(response.data);
      setIsOpen(false);
      setFormData({
        ...formData,
        name: '',
        purchase_date: '',
        maturity_date: '',
        face_value: 0,
        purchase_price: 0,
        interest_rate: 0,
        rating: ''
      });
    } catch (error) {
      console.error('Error adding asset:', error);
    }
  };
  
  return (
    <div>
      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        onClick={() => setIsOpen(true)}
      >
        Add New Asset
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Add New Fixed Income Asset</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="bond">Bond</option>
                    <option value="CD">Certificate of Deposit</option>
                    <option value="treasury">Treasury</option>
                    <option value="moneyMarket">Money Market</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    name="purchase_date"
                    value={formData.purchase_date}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maturity Date</label>
                  <input
                    type="date"
                    name="maturity_date"
                    value={formData.maturity_date}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Face Value ($)</label>
                  <input
                    type="number"
                    name="face_value"
                    value={formData.face_value || ''}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price ($)</label>
                  <input
                    type="number"
                    name="purchase_price"
                    value={formData.purchase_price || ''}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    name="interest_rate"
                    value={formData.interest_rate || ''}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Frequency</label>
                  <select
                    name="interest_payment_frequency"
                    value={formData.interest_payment_frequency}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="semiannual">Semi-Annual</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <input
                    type="text"
                    name="rating"
                    value={formData.rating}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="flex items-center h-full">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="taxable"
                      checked={formData.taxable}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Taxable</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
