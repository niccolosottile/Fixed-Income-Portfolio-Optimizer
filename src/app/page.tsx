'use client';

import { useState, useEffect } from 'react';
import { FixedIncomeAsset, LiquidityEvent, User, Recommendation } from '@/types';
import { supabase } from '@/lib/supabase';
import AssetTable from '../components/AssetTable';
import LiquidityTimeline from '../components/LiquidityTimeline';
import RecommendationPanel from '../components/RecommendationPanel';
import PortfolioSummary from '../components/PortfolioSummary';
import { addMonths, differenceInMonths, format } from 'date-fns';

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
        setUser(userData);
        
        // Fetch assets
        const { data: assetsData, error: assetsError } = await supabase
          .from('fixed_income_assets')
          .select('*')
          .eq('user_id', authUser.id);
          
        if (assetsError) throw assetsError;
        setAssets(assetsData || []);
        
        // Fetch liquidity events
        const { data: eventsData, error: eventsError } = await supabase
          .from('liquidity_events')
          .select('*')
          .eq('user_id', authUser.id);
          
        if (eventsError) throw eventsError;
        setLiquidityEvents(eventsData || []);
        
        // Generate recommendations based on fetched data
        if (userData && assetsData && eventsData) {
          const generatedRecommendations = generateRecommendations(
            userData,
            assetsData,
            eventsData
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

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (!user) return <div className="flex justify-center items-center min-h-screen">User not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Fixed Income Portfolio</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <PortfolioSummary assets={assets} user={user} />
        <LiquidityTimeline events={liquidityEvents} assets={assets} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AssetTable assets={assets} setAssets={setAssets} />
        </div>
        <div>
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
  
  // 1. ROLLOVER RECOMMENDATIONS
  // Find assets that will mature in the next 90 days
  const soonMaturingAssets = assets.filter(asset => {
    const maturityDate = new Date(asset.maturity_date);
    const daysToMaturity = (maturityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return daysToMaturity > 0 && daysToMaturity <= 90;
  });
  
  if (soonMaturingAssets.length > 0) {
    // Get current approximate market rates based on asset type and term
    // In a production app, this would call a market data API
    const approximateRates = {
      'bond': { short: 4.1, medium: 4.5, long: 4.8 },
      'CD': { short: 4.0, medium: 4.3, long: 4.6 },
      'treasury': { short: 3.9, medium: 4.2, long: 4.4 },
      'moneyMarket': { short: 3.8, medium: 0, long: 0 }
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
          return eventDate > today && eventDate <= nextSixMonths;
        })
        .reduce((total, event) => total + event.amount, 0);
      
      const hasLiquidityNeeds = liquidityNeeds > 0;
      
      // Suggest different options based on profile and needs
      if (hasLiquidityNeeds && asset.face_value >= liquidityNeeds) {
        rolloverOptions.push(`Keep ${formatCurrency(liquidityNeeds)} liquid for upcoming expenses`);
        
        if (asset.face_value > liquidityNeeds) {
          const remainder = asset.face_value - liquidityNeeds;
          rolloverOptions.push(`Reinvest ${formatCurrency(remainder)} in a new fixed income asset`);
        }
      } else {
        // Suggest options based on risk profile
        if (isShortTerm) {
          rolloverOptions.push(`Consider a 3-6 month ${asset.type} at approximately ${getApproximateRate(asset.type, 'short')}%`);
        } else if (isMediumTerm) {
          rolloverOptions.push(`Consider a 1-year ${asset.type} at approximately ${getApproximateRate(asset.type, 'medium')}%`);
        } else if (isLongTerm) {
          rolloverOptions.push(`Consider a 2+ year ${asset.type} at approximately ${getApproximateRate(asset.type, 'long')}%`);
        }
      }
      
      recommendations.push({
        category: 'rollover',
        title: `${asset.name} matures in ${daysToMaturity} days`,
        description: `Your ${formatCurrency(asset.face_value)} ${asset.type} will mature soon. Consider these reinvestment options:`,
        actionItems: rolloverOptions
      });
    }
  }
  
  // 2. DIVERSIFICATION RECOMMENDATIONS
  if (assets.length >= 2) {
    // Calculate current asset type distribution
    const assetTypeDistribution: Record<string, number> = {
      bond: 0,
      CD: 0,
      treasury: 0,
      moneyMarket: 0
    };
    
    let totalPortfolioValue = 0;
    
    assets.forEach(asset => {
      assetTypeDistribution[asset.type] += asset.face_value;
      totalPortfolioValue += asset.face_value;
    });
    
    // Calculate percentages
    for (const type in assetTypeDistribution) {
      assetTypeDistribution[type] = (assetTypeDistribution[type] / totalPortfolioValue) * 100;
    }
    
    // Create diversification recommendations based on user risk profile
    // For each risk profile, define ideal distributions
    let idealDistribution: Record<string, [number, number]> = { bond: [0, 0], CD: [0, 0], treasury: [0, 0], moneyMarket: [0, 0] };
    
    if (user.risk_tolerance === 'conservative') {
      idealDistribution = {
        treasury: [30, 50],
        CD: [20, 40],
        bond: [0, 20],
        moneyMarket: [10, 30]
      };
    } else if (user.risk_tolerance === 'moderate') {
      idealDistribution = {
        treasury: [20, 40],
        CD: [20, 30],
        bond: [20, 40],
        moneyMarket: [5, 20]
      };
    } else {
      idealDistribution = {
        treasury: [10, 30],
        CD: [10, 20],
        bond: [40, 60],
        moneyMarket: [5, 15]
      };
    }
    
    // Check for imbalances
    const imbalances = [];
    
    for (const type in idealDistribution) {
      const [min, max] = idealDistribution[type];
      const actual = assetTypeDistribution[type] || 0;
      
      if (actual < min) {
        imbalances.push(`Consider increasing ${type} allocation (currently ${actual.toFixed(1)}%, target ${min}-${max}%)`);
      } else if (actual > max) {
        imbalances.push(`Consider reducing ${type} allocation (currently ${actual.toFixed(1)}%, target ${min}-${max}%)`);
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
  }
  
  // 3. BOND LADDERING RECOMMENDATIONS
  // If there are enough assets to create a ladder or existing maturity clustering
  if (assets.length >= 3) {
    // Group assets by maturity year
    const maturityMap: Record<string, FixedIncomeAsset[]> = {};
    const currentYear = today.getFullYear();
    
    assets.forEach(asset => {
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
    
    // Calculate asset maturities by quarter
    assets.forEach(asset => {
      const maturityDate = new Date(asset.maturity_date);
      if (maturityDate < today) return;
      
      const quarterDiff = Math.floor(differenceInMonths(maturityDate, today) / 3);
      if (quarterDiff >= 4) return; // Only consider next 4 quarters
      
      const quarterStart = addMonths(today, quarterDiff * 3);
      const quarterKey = format(quarterStart, "yyyy-QQQ");
      
      maturityByQuarter[quarterKey] += asset.face_value;
    });
    
    // Find quarters with liquidity gaps
    const liquidityGaps: string[] = [];
    
    Object.entries(liquidityByQuarter).forEach(([quarter, amount]) => {
      const maturingAmount = maturityByQuarter[quarter] || 0;
      const gap = maturingAmount - amount;
      
      if (gap < 0) {
        // There's a liquidity gap in this quarter
        liquidityGaps.push(`${quarter}: ${formatCurrency(Math.abs(gap))} shortfall`);
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
  
  return recommendations;
}

// Helper function to get approximate rates by asset type and term
function getApproximateRate(type: string, term: 'short' | 'medium' | 'long'): number {
  // In a production app, this would be fetched from a market data API
  const rates = {
    'bond': { short: 4.1, medium: 4.5, long: 4.8 },
    'CD': { short: 4.0, medium: 4.3, long: 4.6 },
    'treasury': { short: 3.9, medium: 4.2, long: 4.4 },
    'moneyMarket': { short: 3.8, medium: 0, long: 0 }
  };
  
  // @ts-ignore: Simplified type handling for this example
  return rates[type][term];
}

// Format currency values
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
