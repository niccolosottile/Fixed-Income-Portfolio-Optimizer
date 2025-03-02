'use client';

import { useState } from 'react';
import { FixedIncomeAsset } from '@/types';
import AssetForm from './AssetForm';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface AssetTableProps {
  assets: FixedIncomeAsset[];
  setAssets: React.Dispatch<React.SetStateAction<FixedIncomeAsset[]>>;
}

export default function AssetTable({ assets, setAssets }: AssetTableProps) {
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof FixedIncomeAsset>('maturity_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof FixedIncomeAsset) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAssets = [...assets].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    // Handle dates properly
    if (sortField === 'maturity_date' || sortField === 'purchase_date') {
      const aTime = new Date(aVal as string).getTime();
      const bTime = new Date(bVal as string).getTime();
      if (aTime < bTime) return sortDirection === 'asc' ? -1 : 1;
      if (aTime > bTime) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    }
    
    // Handle other value types
    if (aVal && bVal) {
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleNewAsset = (asset: FixedIncomeAsset) => {
    setAssets([...assets, asset]);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      try {
        const { error } = await supabase
          .from('fixed_income_assets')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        // Update UI state
        setAssets(assets.filter(asset => asset.id !== id));
      } catch (error) {
        console.error('Error deleting asset:', error);
      }
    }
  };

  const calculateYieldToMaturity = (asset: FixedIncomeAsset) => {
    // Simple YTM calculation for display purposes
    const faceValue = asset.face_value;
    const price = asset.purchase_price;
    const couponRate = asset.interest_rate / 100;
    const yearsToMaturity = (new Date(asset.maturity_date).getTime() - new Date().getTime()) / 
                            (1000 * 60 * 60 * 24 * 365);
    
    if (yearsToMaturity <= 0) return 'Matured';
    
    // Simplified YTM formula
    const annualCoupon = faceValue * couponRate;
    const priceGain = faceValue - price;
    const approximateYTM = ((annualCoupon + priceGain / yearsToMaturity) / ((faceValue + price) / 2)) * 100;
    
    return approximateYTM.toFixed(2) + '%';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const toggleExpandAsset = (id: string) => {
    setExpandedAssetId(expandedAssetId === id ? null : id);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Your Fixed Income Assets</h2>
        <AssetForm userId={assets.length > 0 ? assets[0].user_id : 'test-user-id'} onAssetAdded={handleNewAsset} />
      </div>
      
      {assets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>You don't have any assets yet. Add your first one to get started!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('type')}
                >
                  Type
                  {sortField === 'type' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  Name
                  {sortField === 'name' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('maturity_date')}
                >
                  Maturity
                  {sortField === 'maturity_date' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('face_value')}
                >
                  Value
                  {sortField === 'face_value' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('interest_rate')}
                >
                  Rate
                  {sortField === 'interest_rate' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  YTM
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAssets.map((asset) => (
                <>
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {asset.type === 'bond' && 'Bond'}
                        {asset.type === 'CD' && 'CD'}
                        {asset.type === 'treasury' && 'Treasury'}
                        {asset.type === 'moneyMarket' && 'Money Market'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                      {asset.rating && (
                        <div className="text-xs text-gray-500">Rating: {asset.rating}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(asset.maturity_date), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        Purchased: {format(new Date(asset.purchase_date), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(asset.face_value)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{asset.interest_rate}%</div>
                      <div className="text-xs text-gray-500">
                        {asset.interest_payment_frequency === 'monthly' && 'Monthly'}
                        {asset.interest_payment_frequency === 'quarterly' && 'Quarterly'}
                        {asset.interest_payment_frequency === 'semiannual' && 'Semi-Annual'}
                        {asset.interest_payment_frequency === 'annual' && 'Annual'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {calculateYieldToMaturity(asset)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => toggleExpandAsset(asset.id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        {expandedAssetId === asset.id ? 'Hide' : 'Details'}
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  
                  {expandedAssetId === asset.id && (
                    <tr key={`${asset.id}-expanded`}>
                      <td colSpan={7} className="px-6 py-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Purchase Info</p>
                            <p className="text-sm">Purchase Price: {formatCurrency(asset.purchase_price)}</p>
                            <p className="text-sm">Current Premium/Discount: {(((asset.current_price || asset.purchase_price) / asset.face_value - 1) * 100).toFixed(2)}%</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Tax Status</p>
                            <p className="text-sm">{asset.taxable ? 'Taxable' : 'Tax-Free'}</p>
                            <p className="text-sm">Annual Interest: {formatCurrency(asset.face_value * (asset.interest_rate / 100))}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Time to Maturity</p>
                            <p className="text-sm">{Math.max(0, Math.round((new Date(asset.maturity_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}