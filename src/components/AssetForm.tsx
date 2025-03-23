'use client';
import { useState } from 'react';
import { FixedIncomeAsset } from '@/types';
import axios from 'axios';

interface AssetFormProps {
  userId: string;
  onAssetAdded: (asset: FixedIncomeAsset) => void;
  userCurrency?: string;
  userCountry?: string;
}

const currencies = [
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'PLN', name: 'Polish Zloty' },
  { code: 'CZK', name: 'Czech Koruna' },
];

const regions = [
  { code: 'eurozone', name: 'Eurozone' },
  { code: 'uk', name: 'United Kingdom' },
  { code: 'us', name: 'United States' },
  { code: 'emea', name: 'Europe (non-Eurozone)' },
  { code: 'apac', name: 'Asia Pacific' },
  { code: 'latam', name: 'Latin America' },
  { code: 'global', name: 'Global' },
];

export default function AssetForm({ userId, onAssetAdded, userCurrency = 'EUR', userCountry = 'eurozone' }: AssetFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    user_id: userId,
    type: 'governmentBond',
    issuer_type: 'government',
    name: '',
    purchase_date: '',
    maturity_date: '',
    face_value: 0,
    purchase_price: 0,
    current_price: 0,
    interest_rate: 0,
    currency: userCurrency,
    interest_payment_frequency: 'semiannual',
    rating: '',
    rating_agency: 'none',
    region: userCountry,
    taxable: true,
    esg_rating: '',
    callable: false,
    call_date: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/assets', formData);
      onAssetAdded(response.data);
      setIsOpen(false);
      setFormData({
        id: '',
        user_id: userId,
        type: 'governmentBond',
        issuer_type: 'government',
        name: '',
        purchase_date: '',
        maturity_date: '',
        face_value: 0,
        purchase_price: 0,
        current_price: 0,
        interest_rate: 0,
        currency: userCurrency,
        interest_payment_frequency: 'semiannual',
        rating: '',
        rating_agency: 'none',
        region: userCountry,
        taxable: true,
        esg_rating: '',
        callable: false,
        call_date: ''
      });
    } catch (error) {
      console.error('Error adding asset:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
              Basic Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">Asset Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <optgroup label="Government Debt">
                    <option value="governmentBond">Government Bond</option>
                    <option value="treasuryBill">Treasury Bill</option>
                    <option value="treasuryNote">Treasury Note</option>
                    <option value="treasuryBond">Treasury Bond</option>
                    <option value="gilts">UK Gilts</option>
                    <option value="bunds">German Bunds</option>
                    <option value="OATs">French OATs</option>
                    <option value="BTPs">Italian BTPs</option>
                    <option value="inflationLinkedBond">Inflation-Linked Bond</option>
                  </optgroup>
                  <optgroup label="Corporate & Municipal">
                    <option value="corporateBond">Corporate Bond</option>
                    <option value="municipalBond">Municipal Bond</option>
                    <option value="structuredNote">Structured Note</option>
                    <option value="subordinatedBond">Subordinated Bond</option>
                    <option value="perpetualBond">Perpetual Bond</option>
                  </optgroup>
                  <optgroup label="Other Products">
                    <option value="CD">Certificate of Deposit</option>
                    <option value="moneyMarket">Money Market</option>
                    <option value="savingsBond">Savings Bond</option>
                    <option value="other">Other</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="form-label">Issuer Type</label>
                <select
                  name="issuer_type"
                  value={formData.issuer_type}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="government">Government</option>
                  <option value="corporate">Corporate</option>
                  <option value="municipal">Municipal</option>
                  <option value="financial">Financial Institution</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="form-label">Name/Description</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., US Treasury 10Y 2024"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Dates & Values
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Purchase Date</label>
                  <input
                    type="date"
                    name="purchase_date"
                    value={formData.purchase_date}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Maturity Date</label>
                  <input
                    type="date"
                    name="maturity_date"
                    value={formData.maturity_date}
                    onChange={handleChange}
                    className="form-input"
                    required={formData.type !== 'perpetualBond'}
                    disabled={formData.type === 'perpetualBond'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Face Value</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="face_value"
                      value={formData.face_value || ''}
                      onChange={handleChange}
                      className="form-input pl-8"
                      required
                      min="0"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">{currencies.find(c => c.code === formData.currency)?.code}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="form-label">Purchase Price</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="purchase_price"
                      value={formData.purchase_price || ''}
                      onChange={handleChange}
                      className="form-input pl-8"
                      required
                      min="0"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">{currencies.find(c => c.code === formData.currency)?.code}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Interest & Payment Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">Interest/Coupon Rate (%)</label>
                <input
                  type="number"
                  name="interest_rate"
                  value={formData.interest_rate || ''}
                  onChange={handleChange}
                  className="form-input"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                />
              </div>

              <div>
                <label className="form-label">Payment Frequency</label>
                <select
                  name="interest_payment_frequency"
                  value={formData.interest_payment_frequency}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="semiannual">Semi-Annual</option>
                  <option value="annual">Annual</option>
                  <option value="atMaturity">At Maturity</option>
                  <option value="irregular">Irregular</option>
                </select>
              </div>

              <div>
                <label className="form-label">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  {currencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.name} ({currency.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Region</label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  {regions.map(region => (
                    <option key={region.code} value={region.code}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
              </svg>
              Additional Details
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Rating</label>
                  <input
                    type="text"
                    name="rating"
                    value={formData.rating}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., AAA"
                  />
                </div>

                <div>
                  <label className="form-label">Rating Agency</label>
                  <select
                    name="rating_agency"
                    value={formData.rating_agency}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="none">None</option>
                    <option value="S&P">S&P</option>
                    <option value="Moodys">Moody's</option>
                    <option value="Fitch">Fitch</option>
                    <option value="DBRS">DBRS</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">ESG Rating</label>
                <input
                  type="text"
                  name="esg_rating"
                  value={formData.esg_rating}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., AAA"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="taxable"
                    name="taxable"
                    checked={formData.taxable}
                    onChange={handleChange}
                    className="form-checkbox"
                  />
                  <label htmlFor="taxable" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Taxable</label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="callable"
                    name="callable"
                    checked={formData.callable}
                    onChange={handleChange}
                    className="form-checkbox"
                  />
                  <label htmlFor="callable" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Callable Bond</label>
                </div>
              </div>
              
              {formData.callable && (
                <div>
                  <label className="form-label">First Call Date</label>
                  <input
                    type="date"
                    name="call_date"
                    value={formData.call_date}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
        >
          Add Asset
        </button>
      </div>
    </form>
  );
}
