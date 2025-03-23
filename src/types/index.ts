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

export interface FixedIncomeAsset {
	id: string;
	user_id: string;
	type: 'governmentBond' | 'corporateBond' | 'municipalBond' | 'CD' | 
	      'treasuryBill' | 'treasuryNote' | 'treasuryBond' | 'moneyMarket' | 
	      'gilts' | 'bunds' | 'OATs' | 'BTPs' | 'structuredNote' | 
	      'inflationLinkedBond' | 'subordinatedBond' | 'perpetualBond' | 
	      'savingsBond' | 'other';
	issuer_type: 'government' | 'corporate' | 'municipal' | 'financial' | 'other';
	name: string;
	purchase_date: string;
	maturity_date: string;
	face_value: number;
	purchase_price: number;
	current_price?: number;
	interest_rate: number;
	currency: string;
	interest_payment_frequency: 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'atMaturity' | 'irregular';
	rating?: string;
	rating_agency?: 'S&P' | 'Moodys' | 'Fitch' | 'DBRS' | 'other' | 'none';
	taxable: boolean;
	esg_rating?: string;
	callable: boolean;
	call_date?: string;
	region: string;
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
