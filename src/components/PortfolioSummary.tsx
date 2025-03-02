'use client';

import { FixedIncomeAsset, User } from '@/types';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface PortfolioSummaryProps {
  assets: FixedIncomeAsset[];
  user: User;
}

export default function PortfolioSummary({ assets, user }: PortfolioSummaryProps) {
  // Format currency values
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate portfolio metrics
  const calculateMetrics = () => {
    if (assets.length === 0) {
      return {
        totalValue: 0,
        weightedYield: 0,
        weightedMaturity: 0,
        typeDistribution: { bond: 0, CD: 0, treasury: 0, moneyMarket: 0 },
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

    // Calculate distribution by asset type
    const typeDistribution = assets.reduce(
      (dist, asset) => {
        dist[asset.type] = (dist[asset.type] || 0) + asset.face_value;
        return dist;
      },
      { bond: 0, CD: 0, treasury: 0, moneyMarket: 0 } as Record<string, number>
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
      taxableAmount,
      taxExemptAmount
    };
  };

  const metrics = calculateMetrics();

  // Prepare data for asset type distribution chart
  const assetTypeData = {
    labels: ['Bonds', 'CDs', 'Treasury', 'Money Market'],
    datasets: [
      {
        data: [
          metrics.typeDistribution.bond,
          metrics.typeDistribution.CD,
          metrics.typeDistribution.treasury,
          metrics.typeDistribution.moneyMarket,
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
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
          'rgba(255, 99, 132, 0.7)',
          'rgba(75, 192, 192, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          font: {
            size: 10,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw;
            const percentage = (value / metrics.totalValue * 100).toFixed(1);
            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Portfolio Summary</h2>
      
      <div className="grid grid-cols-1 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-500">Total Portfolio Value</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(metrics.totalValue)}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Weighted Avg. Yield</p>
            <p className="text-xl font-semibold text-green-700">{(metrics.weightedYield || 0).toFixed(2)}%</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Weighted Avg. Maturity</p>
            <p className="text-xl font-semibold text-purple-700">
              {(metrics.weightedMaturity || 0).toFixed(1)} years
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Asset Type Distribution</h3>
          <div className="h-36">
            {assets.length > 0 ? (
              <Pie data={assetTypeData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm">No assets yet</p>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Tax Status</h3>
          <div className="h-36">
            {assets.length > 0 ? (
              <Pie data={taxStatusData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm">No assets yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}