export interface User {
	id: string;
	name: string;
	email: string;
	risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
	portfolio_value: number;
	created_at?: string;
	updated_at?: string;
}

export interface FixedIncomeAsset {
	id: string;
	user_id: string;
	type: 'bond' | 'CD' | 'treasury' | 'moneyMarket';
	name: string;
	purchase_date: string;
	maturity_date: string;
	face_value: number;
	purchase_price: number;
	current_price?: number;
	interest_rate: number;
	interest_payment_frequency: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
	rating?: string;
	taxable: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface LiquidityEvent {
	id: string;
	user_id: string;
	amount: number;
	date: string;
	description: string;
	created_at?: string;
	updated_at?: string;
}

export interface Recommendation {
	category: 'rollover' | 'diversification' | 'laddering' | 'liquidity';
	title: string;
	description: string;
	actionItems: string[];
	link?: string;
}
