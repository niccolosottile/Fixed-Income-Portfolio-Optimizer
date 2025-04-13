'use client';
import { FixedIncomeAsset, User } from '@/types';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const assetGroups = {
  government: ['governmentBond', 'treasuryBill', 'treasuryNote', 'treasuryBond', 'gilts', 'bunds', 'OATs', 'BTPs', 'inflationLinkedBond'],
  corporate: ['corporateBond', 'structuredNote', 'subordinatedBond', 'perpetualBond'],
  municipal: ['municipalBond'],
  savings: ['CD', 'savingsBond', 'moneyMarket'],
  other: ['other']
};

const chartColors = {
  backgroundColor: [
    'rgba(79, 70, 229, 0.8)', // indigo - government
    'rgba(236, 72, 153, 0.8)', // pink - corporate
    'rgba(245, 158, 11, 0.8)', // amber - municipal
    'rgba(16, 185, 129, 0.8)', // emerald - savings
    'rgba(99, 102, 241, 0.8)', // indigo-light - other
  ],
  borderColor: [
    'rgba(79, 70, 229, 1)',
    'rgba(236, 72, 153, 1)',
    'rgba(245, 158, 11, 1)',
    'rgba(16, 185, 129, 1)',
    'rgba(99, 102, 241, 1)',
  ],
  hoverOffset: 4
};

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

interface PortfolioSummaryProps {
  assets: FixedIncomeAsset[];
  user: User;
}

export default function PortfolioSummary({ assets, user }: PortfolioSummaryProps) {
  // Get user's preferred currency or default to EUR
  const userCurrency = user?.currency || 'EUR';
  
  // Format currency values
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(getLocaleFromCurrency(userCurrency), {
      style: 'currency',
      currency: userCurrency,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Helper to get locale from currency
  const getLocaleFromCurrency = (currency: string): string => {
    const localeMap: Record<string, string> = {
      USD: 'en-US',
      EUR: 'de-DE',
      GBP: 'en-GB',
      CHF: 'de-CH',
      JPY: 'ja-JP',
      SEK: 'sv-SE',
      NOK: 'no-NO',
      DKK: 'da-DK',
      PLN: 'pl-PL',
      CZK: 'cs-CZ',
    };
    return localeMap[currency] || 'en-GB';
  };
  
  // Calculate portfolio metrics
  const calculateMetrics = () => {
    if (assets.length === 0) {
      return {
        totalValue: 0,
        weightedYield: 0,
        weightedMaturity: 0,
        typeDistribution: {
          government: 0,
          corporate: 0,
          municipal: 0,
          savings: 0,
          other: 0
        },
        currencyDistribution: {},
        regionDistribution: {},
        taxableAmount: 0,
        taxExemptAmount: 0
      };
    }
    
    const now = new Date();
    const totalValue = assets.reduce((sum, asset) => sum + asset.face_value, 0);
    
    // Calculate weighted average yield
    const weightedYield = assets.reduce(
      (sum, asset) => sum + (asset.interest_rate * asset.face_value),
      0
    ) / totalValue;
    
    // Calculate weighted average maturity in years
    const weightedMaturity = assets.reduce(
      (sum, asset) => {
        const maturityDate = new Date(asset.maturity_date);
        const yearsToMaturity = (maturityDate.getTime() - now.getTime()) / 
                                (1000 * 60 * 60 * 24 * 365);
        return sum + (Math.max(0, yearsToMaturity) * asset.face_value);
      },
      0
    ) / totalValue;
    
    // Calculate distribution by asset type group
    const typeDistribution = {
      government: 0,
      corporate: 0,
      municipal: 0,
      savings: 0,
      other: 0
    };
    
    assets.forEach(asset => {
      // Map asset type to group
      let group: 'government' | 'corporate' | 'municipal' | 'savings' | 'other' = 'other';
      for (const [groupName, types] of Object.entries(assetGroups)) {
        if (types.includes(asset.type)) {
          group = groupName as 'government' | 'corporate' | 'municipal' | 'savings' | 'other';
          break;
        }
      }
      typeDistribution[group] += asset.face_value;
    });
    
    // Calculate distribution by currency
    const currencyDistribution = assets.reduce(
      (dist, asset) => {
        dist[asset.currency] = (dist[asset.currency] || 0) + asset.face_value;
        return dist;
      },
      {} as Record<string, number>
    );
    
    // Calculate distribution by region
    const regionDistribution = assets.reduce(
      (dist, asset) => {
        dist[asset.region] = (dist[asset.region] || 0) + asset.face_value;
        return dist;
      },
      {} as Record<string, number>
    );
    
    // Calculate taxable vs tax exempt
    const taxableAmount = assets.reduce(
      (sum, asset) => sum + (asset.taxable ? asset.face_value : 0),
      0
    );
    const taxExemptAmount = totalValue - taxableAmount;
    
    return {
      totalValue,
      weightedYield,
      weightedMaturity,
      typeDistribution,
      currencyDistribution,
      regionDistribution,
      taxableAmount,
      taxExemptAmount
    };
  };
  
  const metrics = calculateMetrics();
  
  // Prepare data for asset type distribution chart
  const assetTypeData = {
    labels: ['Government', 'Corporate', 'Municipal', 'Savings', 'Other'],
    datasets: [
      {
        data: [
          metrics.typeDistribution.government,
          metrics.typeDistribution.corporate,
          metrics.typeDistribution.municipal,
          metrics.typeDistribution.savings,
          metrics.typeDistribution.other,
        ],
        backgroundColor: chartColors.backgroundColor,
        borderColor: chartColors.borderColor,
        borderWidth: 1,
        hoverOffset: chartColors.hoverOffset,
      },
    ],
  };
  
  // Prepare data for tax status chart
  const taxStatusData = {
    labels: ['Taxable', 'Tax-Exempt'],
    datasets: [
      {
        data: [metrics.taxableAmount, metrics.taxExemptAmount],
        backgroundColor: [
          'rgba(236, 72, 153, 0.8)',  // pink
          'rgba(16, 185, 129, 0.8)',  // emerald
        ],
        borderColor: [
          'rgba(236, 72, 153, 1)',
          'rgba(16, 185, 129, 1)',
        ],
        borderWidth: 1,
        hoverOffset: chartColors.hoverOffset,
      },
    ],
  };
  
  // Prepare data for currency distribution
  const currencyData = {
    labels: Object.keys(metrics.currencyDistribution).map(code => 
      `${code} ${currencySymbols[code] || ''}`
    ),
    datasets: [
      {
        data: Object.values(metrics.currencyDistribution),
        backgroundColor: chartColors.backgroundColor,
        borderColor: chartColors.borderColor,
        borderWidth: 1,
        hoverOffset: chartColors.hoverOffset,
      },
    ],
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          font: {
            size: 10,
          },
          color: '#6b7280', // text-gray-500
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#111827',
        bodyColor: '#4b5563',
        bodyFont: {
          size: 12,
        },
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        boxPadding: 6,
        callbacks: {
          label: function(tooltipItem: any) {
            const label = tooltipItem.label || '';
            const value = tooltipItem.raw;
            const percentage = (value / metrics.totalValue * 100).toFixed(1);
            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Portfolio Summary</h2>
        <span className="badge badge-blue">Updated today</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="stat-card bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
          <p className="text-indigo-100 font-medium text-sm">Total Portfolio Value</p>
          <p className="mt-1 text-3xl font-bold">{formatCurrency(metrics.totalValue)}</p>
          <div className="mt-2 text-indigo-100 text-xs">
            {metrics.totalValue > 0 
              ? `${assets.length} fixed income assets managed` 
              : "Add your first asset to begin"}
          </div>
        </div>
        
        <div className="stat-card">
          <p className="stat-card-title">Weighted Avg. Yield</p>
          <div className="flex items-end">
            <p className="stat-card-value text-emerald-600">{(metrics.weightedYield || 0).toFixed(2)}%</p>
            {metrics.weightedYield > 3.5 && (
              <span className="text-xs ml-2 text-emerald-500 flex items-center mb-1">
                <span className="icon-container icon-xs mr-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                </span>
                Good
              </span>
            )}
          </div>
          <div className="progress-bar mt-2">
            <div className="progress-bar-fill bg-emerald-600" style={{ width: `${Math.min(100, metrics.weightedYield * 20)}%` }}></div>
          </div>
        </div>
        
        <div className="stat-card">
          <p className="stat-card-title">Weighted Avg. Maturity</p>
          <p className="stat-card-value text-indigo-600">
            {(metrics.weightedMaturity || 0).toFixed(1)} <span className="text-lg">years</span>
          </p>
          <div className="progress-bar mt-2">
            <div 
              className="progress-bar-fill bg-indigo-600" 
              style={{ 
                width: `${Math.min(100, metrics.weightedMaturity * 10)}%` 
              }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
        <div className="bg-white dark:bg-gray-800 rounded p-4 shadow-sm border border-gray-100 dark:border-gray-700 col-span-1 flex flex-col">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Asset Type Distribution</h3>
          <div className="flex-1 relative min-h-[150px]">
            {assets.length > 0 ? (
              <>
                <Doughnut data={assetTypeData} options={chartOptions} />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="font-bold">{assets.length}</p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 dark:text-gray-600 text-sm">No assets yet</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded p-4 shadow-sm border border-gray-100 dark:border-gray-700 col-span-1 flex flex-col">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tax Status</h3>
          <div className="flex-1 relative min-h-[150px]">
            {assets.length > 0 ? (
              <>
                <Doughnut data={taxStatusData} options={chartOptions} />
                {metrics.taxableAmount > 0 && metrics.taxExemptAmount > 0 && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <p className="text-xs text-gray-500">Taxable</p>
                    <p className="font-bold">{((metrics.taxableAmount / metrics.totalValue) * 100).toFixed(0)}%</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 dark:text-gray-600 text-sm">No assets yet</p>
              </div>
            )}
          </div>
        </div>
        
        {assets.length > 0 && Object.keys(metrics.currencyDistribution).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded p-4 shadow-sm border border-gray-100 dark:border-gray-700 col-span-1 flex flex-col">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {Object.keys(metrics.currencyDistribution).length > 1 ? "Currency Distribution" : "Currency"}
            </h3>
            <div className="flex-1 relative min-h-[150px]">
              {Object.keys(metrics.currencyDistribution).length > 1 ? (
                <Doughnut data={currencyData} options={chartOptions} />
              ) : (
                <div className="flex flex-col justify-center items-center h-full">
                  <div className="mb-2 text-4xl">
                    {currencySymbols[Object.keys(metrics.currencyDistribution)[0]] || Object.keys(metrics.currencyDistribution)[0]}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {Object.keys(metrics.currencyDistribution)[0]}
                  </p>
                  <p className="font-medium mt-2">
                    100% of portfolio
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}