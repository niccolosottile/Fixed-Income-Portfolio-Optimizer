'use client';
import { useState, useEffect, useCallback } from 'react';
import { FixedIncomeAsset, LiquidityEvent, User, Recommendation, CurrencyCode } from '@/types';
import { useAuth } from '@/components/AuthProvider';
import AssetTable from '../components/AssetTable';
import LiquidityTimeline from '../components/LiquidityTimeline';
import RecommendationPanel from '../components/RecommendationPanel';
import PortfolioSummary from '../components/PortfolioSummary';
import Navbar from '../components/Navbar';
import { addMonths, differenceInMonths, format } from 'date-fns';
import { formatCurrency, getMarketValue, getTotalMarketValue, calculateYTM } from '@/lib/utils';

export default function Dashboard() {
  const { user: authUser, loading: authLoading, error: authError } = useAuth();
  const [assets, setAssets] = useState<FixedIncomeAsset[]>([]);
  const [liquidityEvents, setLiquidityEvents] = useState<LiquidityEvent[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Main data fetching function
  const fetchDashboardData = useCallback(async () => {
    if (!authUser?.id) return;

    try {
      setDataLoading(true);

      const [assetsResponse, eventsResponse] = await Promise.all([
        fetch('/api/assets'),
        fetch('/api/liquidity-events')
      ]);

      // Check for errors
      if (!assetsResponse.ok) {
        const errorData = await assetsResponse.json();
        throw new Error(errorData.details || 'Failed to fetch assets');
      }

      if (!eventsResponse.ok) {
        const errorData = await eventsResponse.json();
        throw new Error(errorData.details || 'Failed to fetch liquidity events');
      }

      // Parse response data
      const assetsData = await assetsResponse.json();
      const eventsData = await eventsResponse.json();

      // Process assets - add defaults
      const assetsWithDefaults = (assetsData || []).map((asset: FixedIncomeAsset) => ({
        ...asset,
        currency: asset.currency || authUser.currency || 'EUR',
        region: asset.region || authUser.country || 'eurozone'
      }));

      // Process liquidity events - add defaults
      const eventsWithDefaults = (eventsData || []).map((event: LiquidityEvent) => ({
        ...event,
        currency: event.currency || authUser.currency || 'EUR'
      }));

      // Update state
      setAssets(assetsWithDefaults);
      setLiquidityEvents(eventsWithDefaults);

      // Generate recommendations after data is ready
      if (authUser && assetsWithDefaults) {
        const generatedRecommendations = generateRecommendations(
          authUser,
          assetsWithDefaults,
          eventsWithDefaults
        );

        setRecommendations(generatedRecommendations);
      }

      // Clear any previous errors
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setDataLoading(false);
    }
  }, [authUser]);

  // Fetch data when authentication is complete
  useEffect(() => {
    if (!authLoading && authUser) {
      fetchDashboardData();
    }
  }, [authUser, authLoading, fetchDashboardData]);

  // Redirect to login page
  const handleManualAuth = useCallback(() => {
    window.location.href = '/auth';
  }, []);

  // Set sign out state
  useEffect(() => {
    if (authLoading) return;

    // If we were previously authenticated but now we're not, and we're not in a loading state,
    // this likely means we're signing out
    if (!authUser && !isSigningOut) {
      setIsSigningOut(true);
    }
  }, [authUser, authLoading, isSigningOut]);

  // Combined loading state - we're loading if EITHER auth is loading OR data is loading
  const isLoading = authLoading || dataLoading;

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-850">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-indigo-500 rounded-full mb-4 opacity-75"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            Loading your portfolio data...
          </p>
        </div>
      </div>
    );
  }

  // Handle auth error state - don't show during sign out
  if (authError && !isSigningOut) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4 px-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-850">
        <div className="bg-white dark:bg-gray-800 rounded shadow-lg p-8 text-center max-w-md w-full">
          <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 rounded mb-6">
            <h2 className="font-bold text-lg mb-2">Authentication Error</h2>
            <p>{authError}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleManualAuth}
              className="btn-primary w-full py-2 px-4 bg-indigo-600 text-white rounded-md font-medium"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle case with no authenticated user - don't show during sign out
  if (!authUser && !isSigningOut) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4 px-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-850">
        <div className="bg-white dark:bg-gray-800 rounded shadow-lg p-8 text-center max-w-md w-full">
          <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 p-4 rounded mb-6">
            <h2 className="font-bold text-lg mb-2">Authentication Required</h2>
            <p>Please log in to view your portfolio dashboard.</p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleManualAuth}
              className="btn-primary w-full py-2 px-4 bg-indigo-600 text-white rounded-md font-medium"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If we're signing out, show a clean loading screen instead of error
  if (isSigningOut) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-850">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-indigo-500 rounded-full mb-4 opacity-75"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            Signing out...
          </p>
        </div>
      </div>
    );
  }

  // Normal dashboard render with data
  return (
    <>
      <Navbar user={authUser} />
      <main className="dashboard-layout pt-20">
        {/* Dashboard Header */}
        <header className="dashboard-header mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Investment Portfolio
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage and optimize your fixed income investments
            </p>
          </div>
        </header>

        {/* Puzzle Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* First row - Summary and Timeline */}
          <div className="col-span-12 md:col-span-7">
            <div className="puzzle-item">
              <div className="puzzle-item-content">
                <PortfolioSummary 
                  assets={assets} 
                  user={authUser as User} 
                />
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-5">
            <div className="puzzle-item h-[500px]">
              <div className="puzzle-item-content">
                <LiquidityTimeline 
                  events={liquidityEvents} 
                  assets={assets} 
                  user={authUser as User}
                />
              </div>
            </div>
          </div>

          {/* Second row - Asset Table and Recommendations */}
          <div className="col-span-12 md:col-span-8">
            <div className="puzzle-item h-[550px]">
              <div className="puzzle-item-content">
                <AssetTable 
                  assets={assets} 
                  setAssets={setAssets} 
                  user={authUser as User}
                />
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4">
            <div className="puzzle-item h-[550px]">
              <div className="puzzle-item-content">
                <RecommendationPanel 
                  recommendations={recommendations} 
                  user={authUser as User}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

// Advanced recommendation generator function
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

      // Use market value instead of face value
      const assetMarketValue = getMarketValue(asset);

      // Suggest different options based on profile and needs
      if (hasLiquidityNeeds && assetMarketValue >= liquidityNeeds) {
        rolloverOptions.push(`Keep ${formatCurrency(liquidityNeeds, asset.currency as CurrencyCode)} liquid for upcoming expenses`);

        if (assetMarketValue > liquidityNeeds) {
          const remainder = assetMarketValue - liquidityNeeds;
          rolloverOptions.push(`Reinvest ${formatCurrency(remainder, asset.currency as CurrencyCode)} in a new fixed income asset`);
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
        description: `Your ${formatCurrency(assetMarketValue, asset.currency as CurrencyCode)} ${asset.type} will mature soon. Consider these reinvestment options:`,
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

    // Calculate asset distribution by group using market value
    const assetTypeDistribution: Record<string, number> = {
      government: 0,
      corporate: 0,
      municipal: 0,
      savings: 0,
      other: 0
    };

    // Also track regional and currency distribution using market value
    const regionDistribution: Record<string, number> = {};
    const currencyDistribution: Record<string, number> = {};

    // Use market value for calculations instead of face value
    const totalPortfolioValue = getTotalMarketValue(assets);

    assets.forEach(asset => {
      // Get the market value of the asset
      const marketValue = getMarketValue(asset);

      // Map asset to group
      let group = 'other';
      for (const [groupName, types] of Object.entries(assetGroups)) {
        if (types.includes(asset.type)) {
          group = groupName;
          break;
        }
      }
      assetTypeDistribution[group] += marketValue;

      // Track region
      regionDistribution[asset.region] = (regionDistribution[asset.region] || 0) + marketValue;

      // Track currency
      currencyDistribution[asset.currency] = (currencyDistribution[asset.currency] || 0) + marketValue;
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
      gaps.push(parseInt(years[i]) - parseInt(years[i - 1]));
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
  if (events.length > 0) {
    // Track liquidity needs and available funds by month for the next 24 months
    // This provides a more granular view than quarterly analysis
    const liquidityByMonth: Record<string, { needs: number; maturities: number; date: Date }> = {};

    // Initialize monthly tracking for next 24 months
    for (let i = 0; i < 24; i++) {
      const monthDate = addMonths(today, i);
      const monthKey = format(monthDate, "yyyy-MM");
      liquidityByMonth[monthKey] = {
        needs: 0,
        maturities: 0,
        date: monthDate
      };
    }

    // Calculate liquidity needs by month
    events.forEach(event => {
      const eventDate = new Date(event.date);
      if (eventDate < today) return;

      const monthDiff = differenceInMonths(eventDate, today);
      if (monthDiff >= 24) return; // Only consider next 24 months

      const monthKey = format(eventDate, "yyyy-MM");
      if (liquidityByMonth[monthKey] && event.currency === userCurrency) {
        liquidityByMonth[monthKey].needs += event.amount;
      }
    });

    // Calculate asset maturities by month - use face value for maturity proceeds
    assets.forEach(asset => {
      // Skip perpetual bonds since they don't mature
      if (asset.type === 'perpetualBond') return;

      const maturityDate = new Date(asset.maturity_date);
      if (maturityDate < today) return;

      const monthDiff = differenceInMonths(maturityDate, today);
      if (monthDiff >= 24) return; // Only consider next 24 months

      const monthKey = format(maturityDate, "yyyy-MM");
      if (liquidityByMonth[monthKey] && asset.currency === userCurrency) {
        // Use face_value for maturities - this is what an investor receives at maturity
        liquidityByMonth[monthKey].maturities += asset.face_value;
      }
    });

    // Track cumulative liquidity position - how cash flows accumulate over time
    let cumulativePosition = 0;
    const shortfallMonths: string[] = [];
    const surplusMonths: string[] = [];
    const criticalShortfalls: string[] = [];

    // Sort months chronologically
    const sortedMonths = Object.keys(liquidityByMonth).sort();

    sortedMonths.forEach(month => {
      const { needs, maturities, date } = liquidityByMonth[month];
      const monthlyNetFlow = maturities - needs;
      cumulativePosition += monthlyNetFlow;

      // Track months with significant shortfalls/surpluses
      if (needs > 0) {
        if (maturities < needs) {
          shortfallMonths.push(`${format(date, "MMM yyyy")}: ${formatCurrency(needs - maturities, userCurrency as CurrencyCode)} shortfall`);

          // Critical if shortfall is significant (>20% of total need) AND cumulative position is negative
          if ((needs - maturities) > needs * 0.2 && cumulativePosition < 0) {
            criticalShortfalls.push(format(date, "MMM yyyy"));
          }
        } else if (maturities > needs * 1.5) {
          surplusMonths.push(`${format(date, "MMM yyyy")}: ${formatCurrency(maturities - needs, userCurrency as CurrencyCode)} surplus`);
        }
      }
    });

    // Identify assets that could potentially be sold before maturity to cover shortfalls
    // For pre-maturity sales, we need to use market value instead of face value
    const assetsAvailableForSale: { asset: FixedIncomeAsset; marketValue: number }[] = [];

    if (criticalShortfalls.length > 0) {
      // Find the earliest critical shortfall date
      const earliestCriticalDate = new Date(criticalShortfalls[0] + "-01");

      assets.forEach(asset => {
        if (asset.type === 'perpetualBond') {
          // Perpetual bonds can be sold at market value anytime
          assetsAvailableForSale.push({
            asset,
            marketValue: getMarketValue(asset)
          });
        } else {
          const maturityDate = new Date(asset.maturity_date);

          // Only consider assets that mature AFTER our earliest critical shortfall
          // These are assets we might need to sell early to cover the shortfall
          if (maturityDate > earliestCriticalDate && asset.currency === userCurrency) {
            assetsAvailableForSale.push({
              asset,
              marketValue: getMarketValue(asset)
            });
          }
        }
      });
    }

    // Generate liquidity recommendations
    if (shortfallMonths.length > 0) {
      const liquidityActions = [];

      // Add shortfall warnings
      if (criticalShortfalls.length > 0) {
        liquidityActions.push(`Critical liquidity gaps detected in: ${criticalShortfalls.join(', ')}`);
      }

      // Show significant shortfalls (limited to top 3 to avoid overwhelming)
      if (shortfallMonths.length > 0) {
        liquidityActions.push(`Upcoming liquidity gaps: ${shortfallMonths.slice(0, 3).join(', ')}${shortfallMonths.length > 3 ? ` and ${shortfallMonths.length - 3} more` : ''}`);
      }

      // Calculate total potential liquidity from sellable assets
      const totalSellableValue = assetsAvailableForSale.reduce((sum, item) => sum + item.marketValue, 0);

      if (totalSellableValue > 0) {
        liquidityActions.push(`You have ${formatCurrency(totalSellableValue, userCurrency as CurrencyCode)} in assets that could be sold to meet liquidity needs`);

        // Suggest specific assets that could be sold (if there are critical shortfalls)
        if (criticalShortfalls.length > 0 && assetsAvailableForSale.length > 0) {
          // Sort assets by smallest premium/largest discount to face value
          // (prioritize selling assets closest to or below par)
          const sortedAssets = [...assetsAvailableForSale].sort((a, b) => {
            const premiumA = a.marketValue / a.asset.face_value - 1;
            const premiumB = b.marketValue / b.asset.face_value - 1;
            return premiumA - premiumB; // Smallest premium/largest discount first
          });

          // Suggest the most optimal assets to sell
          const bestAssetToSell = sortedAssets[0];
          const premium = bestAssetToSell.marketValue / bestAssetToSell.asset.face_value - 1;

          liquidityActions.push(
            premium < 0
              ? `Consider selling ${bestAssetToSell.asset.name} at ${formatCurrency(bestAssetToSell.marketValue, userCurrency as CurrencyCode)} (${(premium * 100).toFixed(1)}% discount to face value)`
              : `Consider selling ${bestAssetToSell.asset.name} at ${formatCurrency(bestAssetToSell.marketValue, userCurrency as CurrencyCode)} (${(premium * 100).toFixed(1)}% premium to face value)`
          );
        }
      } else {
        // No assets to sell - suggest alternative liquidity sources
        liquidityActions.push('Consider establishing a credit line or holding more cash-equivalent assets for liquidity needs');
        liquidityActions.push('Short-term Treasury bills or money market funds can provide necessary liquidity');
      }

      // Add ladder adjustment suggestion if there are both shortfalls and surpluses
      if (surplusMonths.length > 0) {
        liquidityActions.push('Adjust your maturity ladder to better match cash flow needs with maturities');
      }

      recommendations.push({
        category: 'liquidity',
        title: 'Liquidity Risk Management',
        description: 'Your upcoming expenses require careful liquidity planning:',
        actionItems: liquidityActions
      });
    } else if (surplusMonths.length > 0) {
      // If no shortfalls but significant surpluses, suggest reinvestment strategies
      recommendations.push({
        category: 'liquidity',
        title: 'Reinvestment Opportunities',
        description: 'You have upcoming periods with excess liquidity after expenses:',
        actionItems: [
          `Upcoming surplus periods: ${surplusMonths.slice(0, 3).join(', ')}${surplusMonths.length > 3 ? ` and ${surplusMonths.length - 3} more` : ''}`,
          'Consider pre-planning reinvestment options for these surplus periods',
          'Look for attractive fixed income opportunities in advance of maturity dates'
        ]
      });
    }
  }

  // 5. YIELD RECOMMENDATIONS FOR SPECIFIC REGIONS
  // Add region-specific yield recommendations
  if (assets.length >= 3) {
    const yieldSuggestions = [];

    // Calculate weighted average yield using YTM
    const totalValue = getTotalMarketValue(assets);
    const weightedYield = assets.reduce(
      (sum, asset) => sum + (calculateYTM(asset) * getMarketValue(asset)),
      0
    ) / totalValue;

    // Use appropriate thresholds based on actual YTM calculations
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
  } catch {
    // Ultimate fallback
    return term === 'short' ? 3.0 : term === 'medium' ? 3.5 : 4.0;
  }
}
