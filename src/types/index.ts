export interface User {
	id: string;
	name: string;
	email: string;
	risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
	portfolio_value: number;
	currency: string;
	country: string;
	created_at?: string;
	updated_at?: string;
}

export type AssetType = 'governmentBond' | 'corporateBond' | 'municipalBond' | 'CD' | 
	'treasuryBill' | 'treasuryNote' | 'treasuryBond' | 'moneyMarket' | 
	'gilts' | 'bunds' | 'OATs' | 'BTPs' | 'structuredNote' | 
	'inflationLinkedBond' | 'subordinatedBond' | 'perpetualBond' | 
	'savingsBond' | 'other';

export type IssuerType = 'government' | 'corporate' | 'municipal' | 'financial' | 'other';

export type InterestFrequency = 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'atMaturity' | 'irregular';

export type RatingAgency = 'S&P' | 'Moodys' | 'Fitch' | 'DBRS' | 'other' | 'none';

export interface FixedIncomeAsset {
	id: string;
	user_id: string;
	type: AssetType;
	issuer_type: IssuerType;
	name: string;
	purchase_date: string;
	maturity_date: string;
	face_value: number;
	purchase_price: number;
	current_price?: number;
	interest_rate: number;
	interest_payment_frequency: InterestFrequency;
	currency: string;
	region: string;
	rating?: string;
	rating_agency?: RatingAgency;
	esg_rating?: string;
	taxable: boolean;
	callable: boolean;
	call_date?: string;
	created_at?: string;
	updated_at?: string;
}

export interface LiquidityEvent {
	id: string;
	user_id: string;
	amount: number;
	currency: string;
	date: string;
	description: string;
	created_at?: string;
	updated_at?: string;
}

export interface Recommendation {
	category: 'rollover' | 'diversification' | 'laddering' | 'liquidity' | 'currency' | 'regional' | 'yield';
	title: string;
	description: string;
	actionItems: string[];
	link?: string;
	region?: string;
}

export interface CurrencyRate {
	base: string;
	quote: string;
	rate: number;
	date: string;
}

export interface RegionalMarketData {
	region: string;
	benchmark_rate: number; // e.g., ECB rate, BoE rate
	inflation_rate: number;
	yield_curve: {[tenor: string]: number}; // e.g., "1Y": 3.5, "5Y": 4.2
	updated_at: string;
}

export const CURRENCIES = [
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
] as const;

export type CurrencyCode = typeof CURRENCIES[number]['code'];

export const CURRENCY_SYMBOLS: Record<string, string> = {
	USD: '$',
	EUR: '€',
	GBP: '£',
	CHF: 'CHF',
	JPY: '¥',
	SEK: 'kr',
	NOK: 'kr',
	DKK: 'kr',
	PLN: 'zł',
	CZK: 'Kč',
};

export const REGIONS = [
  { code: 'eurozone', name: 'Eurozone' },
  { code: 'uk', name: 'United Kingdom' },
  { code: 'us', name: 'United States' },
  { code: 'emea', name: 'Europe (non-Eurozone)' },
  { code: 'apac', name: 'Asia Pacific' },
  { code: 'latam', name: 'Latin America' },
  { code: 'global', name: 'Global' },
] as const;

export type RegionCode = typeof REGIONS[number]['code'];

export const ASSET_GROUPS: Record<string, AssetType[]> = {
  government: ['governmentBond', 'treasuryBill', 'treasuryNote', 'treasuryBond', 'gilts', 'bunds', 'OATs', 'BTPs', 'inflationLinkedBond'],
  corporate: ['corporateBond', 'structuredNote', 'subordinatedBond', 'perpetualBond'],
  municipal: ['municipalBond'],
  savings: ['CD', 'savingsBond', 'moneyMarket'],
  other: ['other']
};

export const ASSET_TYPE_NAMES: Record<AssetType, string> = {
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

export type Term = 'short' | 'medium' | 'long';
