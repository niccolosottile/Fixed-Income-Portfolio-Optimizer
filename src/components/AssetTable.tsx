'use client';
import { useState } from 'react';
import { FixedIncomeAsset, User } from '@/types';
import AssetForm from './AssetForm';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

const assetTypeNames: Record<string, string> = {
  governmentBond: 'Government Bond',
  corporateBond: 'Corporate Bond',
  municipalBond: 'Municipal Bond',
  CD: 'Certificate of Deposit',
  treasuryBill: 'Treasury Bill',
  treasuryNote: 'Treasury Note',
  treasuryBond: 'Treasury Bond',
  moneyMarket: 'Money Market',
  gilts: 'UK Gilts',
  bunds: 'German Bunds',
  OATs: 'French OATs',
  BTPs: 'Italian BTPs',
  structuredNote: 'Structured Note',
  inflationLinkedBond: 'Inflation-Linked Bond',
  subordinatedBond: 'Subordinated Bond',
  perpetualBond: 'Perpetual Bond',
  savingsBond: 'Savings Bond',
  other: 'Other'
};

const regionNames: Record<string, string> = {
  eurozone: 'Eurozone',
  uk: 'United Kingdom',
  us: 'United States',
  emea: 'Europe (non-Eurozone)',
  apac: 'Asia Pacific',
  latam: 'Latin America',
  global: 'Global'
};

interface AssetTableProps {
  assets: FixedIncomeAsset[];
  setAssets: React.Dispatch<React.SetStateAction<FixedIncomeAsset[]>>;
  user?: User;
}

export default function AssetTable({ assets, setAssets, user }: AssetTableProps) {
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof FixedIncomeAsset>('maturity_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState<string>('all');
  const [isAddAssetOpen, setIsAddAssetOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const userCurrency = user?.currency || 'EUR';
  
  const handleSort = (field: keyof FixedIncomeAsset) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Filter assets by type group and search term
  const filteredAssets = assets.filter(asset => {
    const term = searchTerm.toLowerCase();
    const matchesTerm = asset.name.toLowerCase().includes(term) ||
             asset.type.toLowerCase().includes(term) ||
             asset.issuer_type.toLowerCase().includes(term) ||
             (asset.rating ? asset.rating.toLowerCase().includes(term) : false) ||
             (asset.region ? asset.region.toLowerCase().includes(term) : false);

    // First apply type filter
    let matchesFilter = filter === 'all';
    
    if (!matchesFilter) {
      if (filter === 'government') {
        matchesFilter = ['governmentBond', 'treasuryBill', 'treasuryNote', 'treasuryBond', 'gilts', 'bunds', 'OATs', 'BTPs', 'inflationLinkedBond'].includes(asset.type);
      } else if (filter === 'corporate') {
        matchesFilter = ['corporateBond', 'structuredNote', 'subordinatedBond', 'perpetualBond'].includes(asset.type);
      } else if (filter === 'savings') {
        matchesFilter = ['CD', 'savingsBond', 'moneyMarket'].includes(asset.type);
      } else if (filter === 'municipal') {
        matchesFilter = ['municipalBond'].includes(asset.type);
      } else {
        matchesFilter = asset.type === filter;
      }
    }
    
    // Then apply search filter if there's a search term
    if (searchTerm && matchesFilter) {
      return matchesTerm;
    }
    
    return matchesFilter;
  });
  
  // Sort assets
  const sortedAssets = [...filteredAssets].sort((a, b) => {
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
  
  const handleNewAsset = (asset: FixedIncomeAsset | null) => {
    if (asset) {
      setAssets([...assets, asset]);
    }
    setIsAddAssetOpen(false);
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
    // Skip YTM calculation for perpetual bonds
    if (asset.type === 'perpetualBond') return 'Perpetual';
    
    // Simple YTM calculation for display purposes
    const faceValue = asset.face_value;
    const price = asset.purchase_price;
    const couponRate = asset.interest_rate / 100;
    const maturityDate = new Date(asset.maturity_date);
    const yearsToMaturity = (maturityDate.getTime() - new Date().getTime()) / 
                            (1000 * 60 * 60 * 24 * 365);
    
    if (yearsToMaturity <= 0) return 'Matured';
    
    // Simplified YTM formula
    const annualCoupon = faceValue * couponRate;
    const priceGain = faceValue - price;
    const approximateYTM = ((annualCoupon + priceGain / yearsToMaturity) / ((faceValue + price) / 2)) * 100;
    
    return approximateYTM.toFixed(2) + '%';
  };
  
  const formatCurrency = (amount: number, currency = userCurrency) => {
    const locale = currency === 'EUR' ? 'de-DE' : 
                  currency === 'GBP' ? 'en-GB' : 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const toggleExpandAsset = (id: string) => {
    setExpandedAssetId(expandedAssetId === id ? null : id);
  };

  // Get yield status color
  const getYieldStatusColor = (interestRate: number) => {
    if (interestRate > 4.5) return 'badge-green';
    if (interestRate > 3.0) return 'badge-blue';
    if (interestRate > 2.0) return 'badge-yellow';
    return 'badge-gray';
  };

  // Get days to maturity
  const getDaysToMaturity = (maturityDate: string) => {
    if (!maturityDate) return 0;
    const today = new Date();
    const maturity = new Date(maturityDate);
    return Math.max(0, Math.round((maturity.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Fixed Income Assets</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {assets.length} {assets.length === 1 ? 'asset' : 'assets'} in your portfolio
            </p>
          </div>
          
          <button 
            onClick={() => setIsAddAssetOpen(!isAddAssetOpen)} 
            className="btn-primary flex items-center"
          >
            <span className="icon-container icon-sm mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </span>
            Add Asset
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-5">
          <div className="flex flex-1 w-full sm:w-auto">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="icon-container icon-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
              <input
                type="text"
                placeholder="Search assets..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Filter: </label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="form-select sm:w-auto"
            >
              <option value="all">All Assets</option>
              <optgroup label="Asset Groups">
                <option value="government">Government Securities</option>
                <option value="corporate">Corporate Bonds</option>
                <option value="municipal">Municipal Bonds</option>
                <option value="savings">Savings & Money Market</option>
              </optgroup>
              <optgroup label="Specific Types">
                {Object.entries(assetTypeNames).map(([type, name]) => (
                  <option key={type} value={type}>{name}</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>
      
      {assets.length === 0 ? (
        <div className="text-center py-16 px-4 flex-1 flex flex-col items-center justify-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 mb-4">
            <span className="icon-container icon-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No assets yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Start building your fixed income portfolio by adding your first asset. Click the "Add Asset" button to get started.
          </p>
          <button 
            onClick={() => setIsAddAssetOpen(true)} 
            className="btn-primary"
          >
            Add Your First Asset
          </button>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-12 flex-1 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No assets match your filter or search criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
          <table className="saas-table">
            <thead className="sticky top-0 z-10">
              <tr>
                <th 
                  className="cursor-pointer bg-gray-50 dark:bg-gray-700/50"
                  onClick={() => handleSort('type')}
                >
                  <button className="flex items-center">
                    Type
                    {sortField === 'type' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th
                  className="cursor-pointer bg-gray-50 dark:bg-gray-700/50"
                  onClick={() => handleSort('name')}
                >
                  <button className="flex items-center">
                    Name
                    {sortField === 'name' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th
                  className="cursor-pointer bg-gray-50 dark:bg-gray-700/50"
                  onClick={() => handleSort('maturity_date')}
                >
                  <button className="flex items-center">
                    Maturity
                    {sortField === 'maturity_date' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th
                  className="cursor-pointer bg-gray-50 dark:bg-gray-700/50"
                  onClick={() => handleSort('face_value')}
                >
                  <button className="flex items-center">
                    Value
                    {sortField === 'face_value' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th
                  className="cursor-pointer bg-gray-50 dark:bg-gray-700/50"
                  onClick={() => handleSort('interest_rate')}
                >
                  <button className="flex items-center">
                    Rate
                    {sortField === 'interest_rate' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="bg-gray-50 dark:bg-gray-700/50">YTM</th>
                <th className="text-right bg-gray-50 dark:bg-gray-700/50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedAssets.map((asset) => (
                <>
                  <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td>
                      <div className="flex items-center">
                        <span className={`badge mr-2 ${asset.issuer_type === 'corporate' ? 'badge-pink' : asset.issuer_type === 'government' ? 'badge-blue' : 'badge-gray'}`}>
                          {asset.issuer_type === 'corporate' ? 'C' : asset.issuer_type === 'government' ? 'G' : 'O'}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {assetTypeNames[asset.type] || asset.type}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {regionNames[asset.region] || asset.region}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{asset.name}</div>
                      {asset.rating && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <span>Rating: {asset.rating}</span>
                          {asset.rating_agency && asset.rating_agency !== 'none' && (
                            <span className="ml-1">({asset.rating_agency})</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {asset.type === 'perpetualBond' ? (
                          <span className="badge badge-purple">Perpetual</span>
                        ) : (
                          <div>
                            <div>{format(new Date(asset.maturity_date), 'MMM d, yyyy')}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {getDaysToMaturity(asset.maturity_date) > 0 ? (
                                <span>
                                  {getDaysToMaturity(asset.maturity_date)} days left
                                </span>
                              ) : (
                                <span className="text-red-500">Matured</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(asset.face_value, asset.currency)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {asset.currency}
                      </div>
                    </td>
                    <td>
                      <div>
                        <span className={`badge ${getYieldStatusColor(asset.interest_rate)}`}>
                          {asset.interest_rate}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {asset.interest_payment_frequency === 'monthly' && 'Monthly'}
                        {asset.interest_payment_frequency === 'quarterly' && 'Quarterly'}
                        {asset.interest_payment_frequency === 'semiannual' && 'Semi-Annual'}
                        {asset.interest_payment_frequency === 'annual' && 'Annual'}
                        {asset.interest_payment_frequency === 'atMaturity' && 'At Maturity'}
                        {asset.interest_payment_frequency === 'irregular' && 'Irregular'}
                      </div>
                    </td>
                    <td className="text-sm font-medium">
                      <span className="badge badge-blue">
                        {calculateYieldToMaturity(asset)}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => toggleExpandAsset(asset.id)}
                          className="icon-button"
                          title={expandedAssetId === asset.id ? 'Hide details' : 'Show details'}
                        >
                          <span className="icon-container icon-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              {expandedAssetId === asset.id ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              )}
                            </svg>
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="icon-button-danger"
                          title="Delete asset"
                        >
                          <span className="icon-container icon-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {expandedAssetId === asset.id && (
                    <tr className="expanded-content">
                      <td colSpan={7}>
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Purchase Information</h4>
                              <div className="space-y-2 text-sm">
                                <p className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Purchase Date:</span>
                                  <span>{format(new Date(asset.purchase_date), 'MMM d, yyyy')}</span>
                                </p>
                                <p className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Purchase Price:</span>
                                  <span>{formatCurrency(asset.purchase_price, asset.currency)}</span>
                                </p>
                                <p className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Premium/Discount:</span>
                                  <span className={((asset.current_price || asset.purchase_price) / asset.face_value - 1) > 0 ? 'text-green-600' : 'text-red-600'}>
                                    {(((asset.current_price || asset.purchase_price) / asset.face_value - 1) * 100).toFixed(2)}%
                                  </span>
                                </p>
                                {asset.callable && (
                                  <p className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Callable:</span>
                                    <span className="text-amber-600">
                                      {asset.call_date ? format(new Date(asset.call_date), 'MMM d, yyyy') : 'Yes'}
                                    </span>
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tax & Income</h4>
                              <div className="space-y-2 text-sm">
                                <p className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Tax Status:</span>
                                  <span>{asset.taxable ? 'Taxable' : 'Tax-Free'}</span>
                                </p>
                                <p className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Annual Interest:</span>
                                  <span>{formatCurrency(asset.face_value * (asset.interest_rate / 100), asset.currency)}</span>
                                </p>
                                {asset.esg_rating && (
                                  <p className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">ESG Rating:</span>
                                    <span className="badge badge-green">{asset.esg_rating}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Maturity Details</h4>
                              <div className="space-y-2 text-sm">
                                {asset.type === 'perpetualBond' ? (
                                  <p className="text-sm">Perpetual (no maturity)</p>
                                ) : (
                                  <p className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Days to Maturity:</span>
                                    <span>{getDaysToMaturity(asset.maturity_date)}</span>
                                  </p>
                                )}
                                <p className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Issuer Type:</span>
                                  <span>{asset.issuer_type.charAt(0).toUpperCase() + asset.issuer_type.slice(1)}</span>
                                </p>
                              </div>
                            </div>
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
      {/* Add Asset Modal */}
      {isAddAssetOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="text-lg font-medium">Add Asset</h2>
                <button 
                  onClick={() => setIsAddAssetOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="modal-close-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <AssetForm 
                  userId={user?.id || ''} 
                  onAssetAdded={handleNewAsset} 
                  userCurrency={userCurrency}
                  userCountry={user?.country}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}