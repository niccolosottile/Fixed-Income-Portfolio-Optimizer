'use client';
import { useState, useEffect } from 'react';
import { FixedIncomeAsset, LiquidityEvent, User, Recommendation } from '@/types';
import { supabase } from '@/lib/supabase';
import AssetTable from '../components/AssetTable';
import LiquidityTimeline from '../components/LiquidityTimeline';
import RecommendationPanel from '../components/RecommendationPanel';
import PortfolioSummary from '../components/PortfolioSummary';
import { addMonths, differenceInMonths, format } from 'date-fns';

const currencySymbols: Record<string, string> = {
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

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [assets, setAssets] = useState<FixedIncomeAsset[]>([]);
  const [liquidityEvents, setLiquidityEvents] = useState<LiquidityEvent[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get the authenticated user session
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          throw new Error('Not authenticated');
        }
        
        // Fetch user profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
          
        if (userError) throw userError;
        
        // If user doesn't have currency or country, set defaults
        const userWithDefaults = {
          ...userData,
          currency: userData.currency || 'EUR',
          country: userData.country || 'eurozone'
        };
        
        setUser(userWithDefaults);
        
        // Fetch assets
        const { data: assetsData, error: assetsError } = await supabase
          .from('fixed_income_assets')
          .select('*')
          .eq('user_id', authUser.id);
          
        if (assetsError) throw assetsError;
        
        // Add currency/region defaults to any assets that might lack them
        const assetsWithDefaults = (assetsData || []).map(asset => ({
          ...asset,
          currency: asset.currency || userWithDefaults.currency,
          region: asset.region || userWithDefaults.country
        }));
        
        setAssets(assetsWithDefaults);
        
        // Fetch liquidity events
        const { data: eventsData, error: eventsError } = await supabase
          .from('liquidity_events')
          .select('*')
          .eq('user_id', authUser.id);
          
        if (eventsError) throw eventsError;
        
        // Add currency defaults to any liquidity events that might lack them
        const eventsWithDefaults = (eventsData || []).map(event => ({
          ...event,
          currency: event.currency || userWithDefaults.currency
        }));
        
        setLiquidityEvents(eventsWithDefaults);
        
        // Generate recommendations based on fetched data
        if (userWithDefaults && assetsWithDefaults) {
          const generatedRecommendations = generateRecommendations(
            userWithDefaults,
            assetsWithDefaults,
            eventsWithDefaults
          );
          setRecommendations(generatedRecommendations);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleAssetAdded = (newAsset: FixedIncomeAsset) => {
    const updatedAssets = [...assets, newAsset];
    setAssets(updatedAssets);
    
    // Regenerate recommendations when an asset is added
    if (user) {
      const updatedRecommendations = generateRecommendations(user, updatedAssets, liquidityEvents);
      setRecommendations(updatedRecommendations);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-indigo-500 rounded-full animate-spin mb-4 opacity-75"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading your portfolio data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4 px-4">
        <div className="bg-white dark:bg-gray-800 rounded shadow-lg p-8 text-center max-w-md w-full">
          <div className="bg-red-100 text-red-800 p-4 rounded mb-6">
            <h2 className="font-bold text-lg mb-2">Authentication Error</h2>
            <p>Unable to retrieve user data. Please log in again.</p>
          </div>
          <button 
            onClick={() => window.location.href = '/auth'} 
            className="btn-primary w-full"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Dashboard Header */}
      <header className="dashboard-header">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Investment Portfolio
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage and optimize your fixed income investments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-right">
            <div className="text-gray-500 dark:text-gray-400">Welcome,</div>
            <div className="font-medium">{user.name || user.email}</div>
          </div>
          <div className="bg-indigo-100 text-indigo-800 h-10 w-10 rounded-full flex items-center justify-center font-bold">
            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Portfolio Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <PortfolioSummary assets={assets} user={user} />
        </div>
        <div className="lg:col-span-1">
          <LiquidityTimeline events={liquidityEvents} assets={assets} />
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AssetTable assets={assets} setAssets={setAssets} user={user} />
        </div>
        <div className="lg:col-span-1">
          <RecommendationPanel recommendations={recommendations} user={user} />
        </div>
      </div>
    </div>
  );
}

// Advanced recommendation generator
function generateRecommendations(
  user: User, 
  assets: FixedIncomeAsset[], 
  events: LiquidityEvent[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const today = new Date();
  
  // Skip recommendations if data is insufficient
  if (!user || assets.length === 0) {
    return recommendations;
  }
  
  const userCurrency = user.currency || 'EUR';
  const userRegion = user.country || 'eurozone';
  
  // 1. ROLLOVER RECOMMENDATIONS
  // Find assets that will mature in the next 90 days
  const soonMaturingAssets = assets.filter(asset => {
    const maturityDate = new Date(asset.maturity_date);
    const daysToMaturity = (maturityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return daysToMaturity > 0 && daysToMaturity <= 90;
  });
  
  if (soonMaturingAssets.length > 0) {
    // Get current approximate market rates based on asset type, term, and region
    // In a production app, this would call a market data API
    const approximateRates: Record<string, Record<string, Record<string, number>>> = {
      'eurozone': {
        'governmentBond': { short: 2.8, medium: 3.1, long: 3.5 },
        'corporateBond': { short: 3.2, medium: 3.7, long: 4.1 },
        'CD': { short: 2.5, medium: 2.9, long: 3.3 },
        'treasuryBill': { short: 2.7, medium: 3.0, long: 3.4 },
        'moneyMarket': { short: 2.4, medium: 0, long: 0 }
      },
      'uk': {
        'governmentBond': { short: 3.9, medium: 4.2, long: 4.5 },
        'corporateBond': { short: 4.3, medium: 4.7, long: 5.1 },
        'CD': { short: 3.7, medium: 4.0, long: 4.3 },
        'treasuryBill': { short: 3.8, medium: 4.1, long: 4.4 },
        'moneyMarket': { short: 3.6, medium: 0, long: 0 }
      },
      'us': {
        'governmentBond': { short: 4.1, medium: 4.5, long: 4.8 },
        'corporateBond': { short: 4.5, medium: 5.0, long: 5.4 },
        'CD': { short: 4.0, medium: 4.3, long: 4.6 },
        'treasuryBill': { short: 3.9, medium: 4.2, long: 4.4 },
        'moneyMarket': { short: 3.8, medium: 0, long: 0 }
      },
      'global': {
        'governmentBond': { short: 3.5, medium: 3.9, long: 4.2 },
        'corporateBond': { short: 4.0, medium: 4.5, long: 4.8 },
        'CD': { short: 3.4, medium: 3.7, long: 4.0 },
        'treasuryBill': { short: 3.5, medium: 3.8, long: 4.1 },
        'moneyMarket': { short: 3.3, medium: 0, long: 0 }
      }
    };
    
    for (const asset of soonMaturingAssets) {
      const maturityDate = new Date(asset.maturity_date);
      const daysToMaturity = Math.round((maturityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Determine best rollover options based on user risk profile and liquidity needs
      const rolloverOptions = [];
      const isShortTerm = user.risk_tolerance === 'conservative';
      const isMediumTerm = user.risk_tolerance === 'moderate';
      const isLongTerm = user.risk_tolerance === 'aggressive';
      
      // Check for upcoming liquidity needs
      const nextSixMonths = addMonths(today, 6);
      const liquidityNeeds = events
        .filter(event => {
          const eventDate = new Date(event.date);
          return eventDate > today && eventDate <= nextSixMonths && event.currency === asset.currency;
        })
        .reduce((total, event) => total + event.amount, 0);
      
      const hasLiquidityNeeds = liquidityNeeds > 0;
      
      // Suggest different options based on profile and needs
      if (hasLiquidityNeeds && asset.face_value >= liquidityNeeds) {
        rolloverOptions.push(`Keep ${formatCurrency(liquidityNeeds, asset.currency)} liquid for upcoming expenses`);
        
        if (asset.face_value > liquidityNeeds) {
          const remainder = asset.face_value - liquidityNeeds;
          rolloverOptions.push(`Reinvest ${formatCurrency(remainder, asset.currency)} in a new fixed income asset`);
        }
      } else {
        // Default to asset type or find a similar one
        let assetTypeForRate = asset.type.includes('Bond') ? 'governmentBond' : 
                              asset.type.includes('treasury') ? 'treasuryBill' : asset.type;
        
        // Make sure the asset type exists in our rate database, otherwise use a default
        const validRegion = (asset.region in approximateRates) ? asset.region : 'global';
        
        if (!approximateRates[validRegion]?.[assetTypeForRate]) {
          assetTypeForRate = asset.issuer_type === 'corporate' ? 'corporateBond' : 'governmentBond';
        }

        // Suggest options based on risk profile
        const region = (asset.region in approximateRates) ? asset.region : 'global';
        
        if (isShortTerm) {
          rolloverOptions.push(`Consider a 3-6 month ${assetTypeForRate} at approximately ${getApproximateRate(region, assetTypeForRate, 'short', approximateRates)}%`);
        } else if (isMediumTerm) {
          rolloverOptions.push(`Consider a 1-year ${assetTypeForRate} at approximately ${getApproximateRate(region, assetTypeForRate, 'medium', approximateRates)}%`);
        } else if (isLongTerm) {
          rolloverOptions.push(`Consider a 2+ year ${assetTypeForRate} at approximately ${getApproximateRate(region, assetTypeForRate, 'long', approximateRates)}%`);
        }
        
        // Add a cross-currency suggestion if appropriate
        if (userRegion !== asset.region && (isMediumTerm || isLongTerm)) {
          const alternateRegion = userRegion === 'eurozone' ? 'uk' : 'eurozone';
          const alternateType = asset.issuer_type === 'corporate' ? 'corporateBond' : 'governmentBond';
          const term = isMediumTerm ? 'medium' : 'long';
          rolloverOptions.push(`For diversification, consider a ${alternateRegion === 'eurozone' ? 'Eurozone' : 'UK'} ${alternateType} at approximately ${getApproximateRate(alternateRegion, alternateType, term, approximateRates)}%`);
        }
      }
      
      recommendations.push({
        category: 'rollover',
        title: `${asset.name} matures in ${daysToMaturity} days`,
        description: `Your ${formatCurrency(asset.face_value, asset.currency)} ${asset.type} will mature soon. Consider these reinvestment options:`,
        actionItems: rolloverOptions,
        region: asset.region
      });
    }
  }
  
  // 2. DIVERSIFICATION RECOMMENDATIONS
  if (assets.length >= 2) {
    // Group assets by type group
    const assetGroups = {
      government: ['governmentBond', 'treasuryBill', 'treasuryNote', 'treasuryBond', 'gilts', 'bunds', 'OATs', 'BTPs', 'inflationLinkedBond'],
      corporate: ['corporateBond', 'structuredNote', 'subordinatedBond', 'perpetualBond'],
      municipal: ['municipalBond'],
      savings: ['CD', 'savingsBond', 'moneyMarket'],
      other: ['other']
    };
    
    // Calculate asset distribution by group
    const assetTypeDistribution: Record<string, number> = {
      government: 0,
      corporate: 0,
      municipal: 0,
      savings: 0,
      other: 0
    };
    
    // Also track regional and currency distribution
    const regionDistribution: Record<string, number> = {};
    const currencyDistribution: Record<string, number> = {};
    
    let totalPortfolioValue = 0;
    
    assets.forEach(asset => {
      // Map asset to group
      let group = 'other';
      for (const [groupName, types] of Object.entries(assetGroups)) {
        if (types.includes(asset.type)) {
          group = groupName;
          break;
        }
      }
      assetTypeDistribution[group] += asset.face_value;
      
      // Track region
      regionDistribution[asset.region] = (regionDistribution[asset.region] || 0) + asset.face_value;
      
      // Track currency
      currencyDistribution[asset.currency] = (currencyDistribution[asset.currency] || 0) + asset.face_value;
      
      totalPortfolioValue += asset.face_value;
    });
    
    // Calculate percentages
    for (const group in assetTypeDistribution) {
      assetTypeDistribution[group] = (assetTypeDistribution[group] / totalPortfolioValue) * 100;
    }
    
    for (const region in regionDistribution) {
      regionDistribution[region] = (regionDistribution[region] / totalPortfolioValue) * 100;
    }
    
    for (const currency in currencyDistribution) {
      currencyDistribution[currency] = (currencyDistribution[currency] / totalPortfolioValue) * 100;
    }
    
    // Create diversification recommendations based on user risk profile
    // For each risk profile, define ideal distributions
    let idealDistribution: Record<string, [number, number]>;
    
    if (user.risk_tolerance === 'conservative') {
      idealDistribution = {
        government: [40, 70],
        corporate: [10, 30],
        municipal: [0, 20],
        savings: [10, 30],
        other: [0, 10]
      };
    } else if (user.risk_tolerance === 'moderate') {
      idealDistribution = {
        government: [30, 50],
        corporate: [20, 40],
        municipal: [0, 30],
        savings: [5, 20],
        other: [0, 15]
      };
    } else {
      idealDistribution = {
        government: [15, 40],
        corporate: [30, 60],
        municipal: [0, 40],
        savings: [0, 15],
        other: [0, 20]
      };
    }
    
    // Check for imbalances
    const imbalances = [];
    
    for (const group in idealDistribution) {
      const [min, max] = idealDistribution[group];
      const actual = assetTypeDistribution[group] || 0;
      
      if (actual < min) {
        imbalances.push(`Consider increasing ${group} allocation (currently ${actual.toFixed(1)}%, target ${min}-${max}%)`);
      } else if (actual > max) {
        imbalances.push(`Consider reducing ${group} allocation (currently ${actual.toFixed(1)}%, target ${min}-${max}%)`);
      }
    }
    
    if (imbalances.length > 0) {
      recommendations.push({
        category: 'diversification',
        title: 'Portfolio Balance Optimization',
        description: `Based on your ${user.risk_tolerance} risk profile, we recommend adjusting your asset allocation:`,
        actionItems: imbalances
      });
    }
    
    // 2.1 Check for regional concentration
    const dominantRegion = Object.entries(regionDistribution)
      .sort((a, b) => b[1] - a[1])[0];
      
    if (dominantRegion && dominantRegion[1] > 70) {
      const regionalSuggestions = [];
      
      if (dominantRegion[0] === 'eurozone') {
        regionalSuggestions.push('Consider adding UK or US fixed income assets to diversify from Eurozone exposure');
      } else if (dominantRegion[0] === 'uk') {
        regionalSuggestions.push('Consider adding Eurozone fixed income assets to diversify from UK exposure');
      } else if (dominantRegion[0] === 'us') {
        regionalSuggestions.push('Consider adding European fixed income assets to diversify from US exposure');
      }
      
      regionalSuggestions.push(`${dominantRegion[0]} represents ${dominantRegion[1].toFixed(1)}% of your portfolio`);
      
      recommendations.push({
        category: 'regional',
        title: 'Geographical Diversification',
        description: 'Your portfolio is highly concentrated in one region:',
        actionItems: regionalSuggestions
      });
    }
    
    // 2.2 Check for currency concentration
    const dominantCurrency = Object.entries(currencyDistribution)
      .sort((a, b) => b[1] - a[1])[0];
      
    if (dominantCurrency && dominantCurrency[1] > 80) {
      const currencySuggestions = [];
      
      if (dominantCurrency[0] === 'EUR') {
        currencySuggestions.push('Consider adding GBP or USD denominated assets to reduce Euro exposure');
      } else if (dominantCurrency[0] === 'GBP') {
        currencySuggestions.push('Consider adding EUR or USD denominated assets to reduce Pound exposure');
      } else if (dominantCurrency[0] === 'USD') {
        currencySuggestions.push('Consider adding EUR or GBP denominated assets to reduce Dollar exposure');
      }
      
      currencySuggestions.push(`${dominantCurrency[0]} represents ${dominantCurrency[1].toFixed(1)}% of your portfolio value`);
      
      recommendations.push({
        category: 'currency',
        title: 'Currency Diversification',
        description: 'Your portfolio is concentrated in one currency:',
        actionItems: currencySuggestions
      });
    }
  }
  
  // 3. BOND LADDERING RECOMMENDATIONS
  // If there are enough assets to create a ladder or existing maturity clustering
  if (assets.length >= 3) {
    // Group assets by maturity year
    const maturityMap: Record<string, FixedIncomeAsset[]> = {};
    const currentYear = today.getFullYear();
    
    assets.forEach(asset => {
      // Skip perpetual bonds for laddering
      if (asset.type === 'perpetualBond') return;
      
      const maturityDate = new Date(asset.maturity_date);
      const maturityYear = maturityDate.getFullYear();
      
      if (!maturityMap[maturityYear]) {
        maturityMap[maturityYear] = [];
      }
      
      maturityMap[maturityYear].push(asset);
    });
    
    // Check for clustering of maturities
    const years = Object.keys(maturityMap).sort();
    const gaps: number[] = [];
    for (let i = 1; i < years.length; i++) {
      gaps.push(parseInt(years[i]) - parseInt(years[i-1]));
    }
    
    // Find the next empty year for a ladder
    const hasClusteredMaturities = Object.values(maturityMap).some(yearAssets => yearAssets.length >= 3);
    const missingYears = [];
    
    // Look for gaps in the ladder
    for (let year = currentYear; year <= currentYear + 5; year++) {
      if (!maturityMap[year]) {
        missingYears.push(year);
      }
    }
    
    if (hasClusteredMaturities || missingYears.length > 0) {
      const suggestedLadderStrategy = [];
      
      if (hasClusteredMaturities) {
        // Find the year with the most maturities
        let maxYear = '';
        let maxCount = 0;
        
        Object.entries(maturityMap).forEach(([year, yearAssets]) => {
          if (yearAssets.length > maxCount) {
            maxYear = year;
            maxCount = yearAssets.length;
          }
        });
        
        suggestedLadderStrategy.push(`Diversify your ${maxYear} maturities into other years to smooth your cash flow`);
      }
      
      if (missingYears.length > 0) {
        // Suggest filling gaps in the ladder
        for (let i = 0; i < Math.min(3, missingYears.length); i++) {
          suggestedLadderStrategy.push(`Consider adding securities maturing in ${missingYears[i]} to complete your ladder`);
        }
      }
      
      if (suggestedLadderStrategy.length > 0) {
        recommendations.push({
          category: 'laddering',
          title: 'Bond Ladder Optimization',
          description: 'A well-structured bond ladder can help balance liquidity needs with yield:',
          actionItems: suggestedLadderStrategy
        });
      }
    }
  }
  
  // 4. LIQUIDITY PLANNING RECOMMENDATIONS
  // Check if there's a significant upcoming liquidity event not covered by maturing assets
  if (events.length > 0) {
    // Group events by quarter (next 4 quarters)
    const liquidityByQuarter: Record<string, number> = {};
    const maturityByQuarter: Record<string, number> = {};
    
    // Initialize quarters
    for (let i = 0; i < 4; i++) {
      const quarterStart = addMonths(today, i * 3);
      const quarterKey = format(quarterStart, "yyyy-QQQ");
      liquidityByQuarter[quarterKey] = 0;
      maturityByQuarter[quarterKey] = 0;
    }
    
    // Calculate liquidity needs by quarter
    events.forEach(event => {
      const eventDate = new Date(event.date);
      if (eventDate < today) return;
      
      const quarterDiff = Math.floor(differenceInMonths(eventDate, today) / 3);
      if (quarterDiff >= 4) return; // Only consider next 4 quarters
      
      const quarterStart = addMonths(today, quarterDiff * 3);
      const quarterKey = format(quarterStart, "yyyy-QQQ");
      
      liquidityByQuarter[quarterKey] += event.amount;
    });
    
    // Calculate asset maturities by quarter (only for matching currency)
    assets.forEach(asset => {
      // Skip perpetual bonds
      if (asset.type === 'perpetualBond') return;
      
      const maturityDate = new Date(asset.maturity_date);
      if (maturityDate < today) return;
      
      const quarterDiff = Math.floor(differenceInMonths(maturityDate, today) / 3);
      if (quarterDiff >= 4) return; // Only consider next 4 quarters
      
      const quarterStart = addMonths(today, quarterDiff * 3);
      const quarterKey = format(quarterStart, "yyyy-QQQ");
      
      // Only count if currency matches the user's preferred currency
      if (asset.currency === userCurrency) {
        maturityByQuarter[quarterKey] += asset.face_value;
      }
    });
    
    // Find quarters with liquidity gaps
    const liquidityGaps: string[] = [];
    
    Object.entries(liquidityByQuarter).forEach(([quarter, amount]) => {
      if (amount === 0) return; // Skip quarters with no expenses
      
      const maturingAmount = maturityByQuarter[quarter] || 0;
      const gap = maturingAmount - amount;
      
      if (gap < 0) {
        // There's a liquidity gap in this quarter
        liquidityGaps.push(`${quarter}: ${formatCurrency(Math.abs(gap), userCurrency)} shortfall`);
      }
    });
    
    if (liquidityGaps.length > 0) {
      const liquidityActions = [];
      
      if (liquidityGaps.length === 1) {
        liquidityActions.push(`Adjust your ladder to align a maturity with your ${liquidityGaps[0]} expense`);
      } else {
        liquidityActions.push(`Adjust your maturities to cover upcoming expenses: ${liquidityGaps.join(', ')}`);
      }
      
      // Suggest money market or short-term assets for better liquidity
      liquidityActions.push('Consider allocating funds to money market accounts for immediate liquidity needs');
      
      recommendations.push({
        category: 'liquidity',
        title: 'Liquidity Gap Planning',
        description: 'Your upcoming expenses may exceed your maturing investments in some periods:',
        actionItems: liquidityActions
      });
    }
  }

  // 5. YIELD RECOMMENDATIONS FOR SPECIFIC REGIONS
  // Add region-specific yield recommendations
  if (assets.length >= 3) {
    const yieldSuggestions = [];
    
    // Calculate weighted average yield
    const totalValue = assets.reduce((sum, asset) => sum + asset.face_value, 0);
    const weightedYield = assets.reduce(
      (sum, asset) => sum + (asset.interest_rate * asset.face_value),
      0
    ) / totalValue;
    
    if (userRegion === 'eurozone' && weightedYield < 3.0) {
      yieldSuggestions.push('Consider peripheral Eurozone government bonds (Italy, Spain) for higher yields');
      yieldSuggestions.push('Investment grade corporate bonds can offer yield premiums over government debt');
    } 
    else if (userRegion === 'uk' && weightedYield < 4.0) {
      yieldSuggestions.push('Consider longer-dated gilts for better yield');
      yieldSuggestions.push('UK corporate bonds offer a yield premium over government securities');
    }
    
    if (yieldSuggestions.length > 0) {
      recommendations.push({
        category: 'yield',
        title: 'Yield Enhancement Strategies',
        description: `Your current portfolio yield is ${weightedYield.toFixed(2)}%. Consider these options:`,
        actionItems: yieldSuggestions,
        region: userRegion
      });
    }
  }
  
  return recommendations;
}

// Helper function to get approximate rates by region, asset type and term
function getApproximateRate(
  region: string, 
  assetType: string, 
  term: 'short' | 'medium' | 'long',
  ratesDb: Record<string, Record<string, Record<string, number>>>
): number {
  try {
    if (region in ratesDb && assetType in ratesDb[region] && term in ratesDb[region][assetType]) {
      return ratesDb[region][assetType][term];
    }
    // Fallback to global government bond rates if the specific combination isn't found
    return ratesDb.global.governmentBond[term];
  } catch (e) {
    // Ultimate fallback 
    return term === 'short' ? 3.0 : term === 'medium' ? 3.5 : 4.0;
  }
}

// Format currency values with proper currency symbol
function formatCurrency(amount: number, currencyCode = 'EUR'): string {
  const locale = currencyCode === 'EUR' ? 'de-DE' : 
                currencyCode === 'GBP' ? 'en-GB' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}
