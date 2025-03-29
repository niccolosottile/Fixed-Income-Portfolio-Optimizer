'use client';
import { useState } from 'react';
import { FixedIncomeAsset } from '@/types';
import axios from 'axios';

interface AssetFormProps {
  userId: string;
  onAssetAdded: (asset: FixedIncomeAsset | null) => void;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const formatCurrency = (value: number) => {
    if (!value && value !== 0) return '';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  };

  const parseInputValue = (value: string) => {
    if (!value) return 0;
    // Remove all non-numeric characters except decimal points
    return parseFloat(value.replace(/[^0-9.]/g, ''));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.purchase_date) {
      errors.purchase_date = 'Purchase date is required';
    }
    
    if (!formData.maturity_date && formData.type !== 'perpetualBond') {
      errors.maturity_date = 'Maturity date is required';
    }
    
    if (formData.face_value <= 0) {
      errors.face_value = 'Face value must be greater than 0';
    }
    
    if (formData.purchase_price <= 0) {
      errors.purchase_price = 'Purchase price must be greater than 0';
    }
    
    if (formData.interest_rate < 0 || formData.interest_rate > 100) {
      errors.interest_rate = 'Interest rate must be between 0 and 100';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add asset');
      }
      
      const newAsset = await response.json();
      onAssetAdded(newAsset);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    onAssetAdded(null);
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
  };

  return (
    <form onSubmit={handleSubmit} className="overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="form-section min-h-[23rem]">
            <h3 className="form-section-title flex items-center">
              <span className="icon-container icon-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
              </span>
              Basic Information
            </h3>
            
            <div className="space-y-4 mt-4">
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
                  className={`form-input ${formErrors.name ? 'border-red-500' : ''}`}
                  placeholder="e.g., US Treasury 10Y 2024"
                  required
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="form-section min-h-[27rem]">
            <h3 className="form-section-title flex items-center">
              <span className="icon-container icon-sm mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </span>
              Interest & Payment Details
            </h3>
            
            <div className="space-y-4 mt-4">
              <div>
                <label className="form-label">Interest/Coupon Rate (%)</label>
                <input
                  type="number"
                  name="interest_rate"
                  value={formData.interest_rate}
                  onChange={handleChange}
                  className={`form-input ${formErrors.interest_rate ? 'border-red-500' : ''}`}
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0"
                  required
                />
                {formErrors.interest_rate && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.interest_rate}</p>
                )}
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
        </div>

        {/* Right Column */}
        <div className="space-y-6">
        <div className="form-section min-h-[23rem]">
            <h3 className="form-section-title flex items-center">
              <span className="icon-container icon-sm mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </span>
              Dates & Values
            </h3>
            
            <div className="space-y-4 mt-4">
              <div className="form-row">
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

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="form-label">Face Value</label>
                  <div className="currency-input-container h-10">
                    <div className="currency-symbol w-[4.5rem] flex-shrink-0">
                      {currencies.find(c => c.code === formData.currency)?.code}
                    </div>
                    <input
                      type="text" 
                      name="face_value"
                      value={formData.face_value !== 0 ? formatCurrency(formData.face_value) : ''}
                      onChange={(e) => {
                        const value = parseInputValue(e.target.value);
                        setFormData({ ...formData, face_value: value });
                      }}
                      className="currency-input flex-grow"
                      placeholder="0.00"
                      required
                      aria-describedby="face-value-help"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="face-value-help">
                    Enter the nominal/face value of the asset.
                  </p>
                  {formErrors.face_value && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.face_value}</p>
                  )}
                </div>
                <div>
                  <label className="form-label">Purchase Price</label>
                  <div className="currency-input-container h-10">
                    <div className="currency-symbol w-[4.5rem] flex-shrink-0">
                      {currencies.find(c => c.code === formData.currency)?.code}
                    </div>
                    <input
                      type="text"
                      name="purchase_price"
                      value={formData.purchase_price !== 0 ? formatCurrency(formData.purchase_price) : ''} 
                      onChange={(e) => {
                        const value = parseInputValue(e.target.value);
                        setFormData({ ...formData, purchase_price: value });
                      }}
                      className="currency-input flex-grow"
                      placeholder="0.00"
                      required
                      aria-describedby="purchase-price-help"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="purchase-price-help">
                    Enter the actual price paid for the asset.
                  </p>
                  {formErrors.purchase_price && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.purchase_price}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="form-section min-h-[27rem]">
            <h3 className="form-section-title flex items-center">
              <span className="icon-container icon-sm mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3.819l-.258.966a1 1 0 001.3.819l.258-.966a1 1 0 00-.819-1.3zm2.3 6.3c.758 0 1.44.34 1.9.878l.138-.136a1 1 0 111.415 1.414l-1.707 1.707a1 1 0 01-1.414 0l-1.707-1.707a1 1 0 111.414-1.414l.139.136c.459-.538 1.141-.878 1.899-.878z" clipRule="evenodd" />
                </svg>
              </span>
              Additional Details
            </h3>
            
            <div className="space-y-4 mt-4">
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
                    className="form-input date-input w-full"
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Add additional sections here if needed in the future */}
        </div>
      </div>

      <div className="modal-footer mt-6">
        <button
          type="button"
          onClick={handleCancel}
          className="btn-secondary h-9 w-24 text-sm"
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
              Adding...
            </>
          ) : (
            <>
              <span className="icon-container icon-xs mr-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </span>
              Add Asset
            </>
          )}
        </button>
      </div>
    </form>
  );
}
