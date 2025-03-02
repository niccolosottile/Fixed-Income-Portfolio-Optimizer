'use client';

import { useEffect, useRef } from 'react';
import { FixedIncomeAsset, LiquidityEvent } from '@/types';
import { format, addMonths } from 'date-fns';
import { Chart, registerables } from 'chart.js';

// Register all Chart.js components
Chart.register(...registerables);

interface LiquidityTimelineProps {
  events: LiquidityEvent[];
  assets: FixedIncomeAsset[];
}

export default function LiquidityTimeline({ events, assets }: LiquidityTimelineProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || assets.length === 0 && events.length === 0) return;

    // Clean up previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Prepare data for timeline
    const today = new Date();
    const nextYear = addMonths(today, 18);
    const months = [];
    const currentDate = new Date(today);
    
    // Generate all months for the timeline
    while (currentDate <= nextYear) {
      months.push(format(currentDate, 'MMM yyyy'));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Prepare datasets
    const assetMaturityData = Array(months.length).fill(0);
    const liquidityEventData = Array(months.length).fill(0);

    // Process asset maturities
    assets.forEach(asset => {
      const maturityDate = new Date(asset.maturity_date);
      if (maturityDate >= today && maturityDate <= nextYear) {
        const monthIndex = (maturityDate.getMonth() - today.getMonth()) + 
                           ((maturityDate.getFullYear() - today.getFullYear()) * 12);
        if (monthIndex >= 0 && monthIndex < months.length) {
          assetMaturityData[monthIndex] += asset.face_value;
        }
      }
    });

    // Process liquidity events
    events.forEach(event => {
      const eventDate = new Date(event.date);
      if (eventDate >= today && eventDate <= nextYear) {
        const monthIndex = (eventDate.getMonth() - today.getMonth()) + 
                           ((eventDate.getFullYear() - today.getFullYear()) * 12);
        if (monthIndex >= 0 && monthIndex < months.length) {
          liquidityEventData[monthIndex] -= event.amount; // Negative as it's an outflow
        }
      }
    });

    // Calculate cumulative liquidity
    const cumulativeLiquidity = Array(months.length).fill(0);
    let runningBalance = 0;

    for (let i = 0; i < months.length; i++) {
      runningBalance += assetMaturityData[i] + liquidityEventData[i];
      cumulativeLiquidity[i] = runningBalance;
    }

    // Create chart
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Asset Maturities',
            data: assetMaturityData,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            barPercentage: 0.8,
          },
          {
            label: 'Liquidity Needs',
            data: liquidityEventData.map(val => val < 0 ? Math.abs(val) : 0), // Converts negative to positive for display
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            barPercentage: 0.8,
          },
          {
            label: 'Cumulative Balance',
            data: cumulativeLiquidity,
            type: 'line',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            yAxisID: 'y1',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Month'
            }
          },
          y: {
            stacked: true,
            title: {
              display: true,
              text: 'Amount ($)'
            },
            ticks: {
              callback: (value) => {
                return '$' + value.toLocaleString();
              }
            }
          },
          y1: {
            position: 'right',
            title: {
              display: true,
              text: 'Cumulative ($)'
            },
            grid: {
              drawOnChartArea: false
            },
            ticks: {
              callback: (value) => {
                return '$' + value.toLocaleString();
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(context.parsed.y);
                }
                return label;
              }
            }
          },
          title: {
            display: true,
            text: 'Liquidity Timeline (18 Months)'
          },
          legend: {
            position: 'bottom'
          },
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [events, assets]);

  // Summarize liquidity needs
  const getTotalLiquidityNeeds = (): number => {
    const today = new Date();
    const sixMonthsOut = addMonths(today, 6);
    return events
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= today && eventDate <= sixMonthsOut;
      })
      .reduce((acc, event) => acc + event.amount, 0);
  };

  // Calculate total maturing assets
  const getTotalMaturingAssets = (): number => {
    const today = new Date();
    const sixMonthsOut = addMonths(today, 6);
    return assets
      .filter(asset => {
        const maturityDate = new Date(asset.maturity_date);
        return maturityDate >= today && maturityDate <= sixMonthsOut;
      })
      .reduce((acc, asset) => acc + asset.face_value, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const liquidityNeeds = getTotalLiquidityNeeds();
  const maturingAssets = getTotalMaturingAssets();
  const liquidityGap = maturingAssets - liquidityNeeds;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 col-span-2">
      <h2 className="text-xl font-semibold mb-4">Liquidity Timeline</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Maturing in 6 Months</p>
          <p className="text-xl font-semibold text-blue-700">{formatCurrency(maturingAssets)}</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Upcoming Expenses</p>
          <p className="text-xl font-semibold text-red-700">{formatCurrency(liquidityNeeds)}</p>
        </div>
        
        <div className={`p-4 rounded-lg ${liquidityGap >= 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
          <p className="text-sm text-gray-500 mb-1">Liquidity Gap</p>
          <p className={`text-xl font-semibold ${liquidityGap >= 0 ? 'text-green-700' : 'text-yellow-700'}`}>
            {formatCurrency(liquidityGap)}
          </p>
          {liquidityGap < 0 && (
            <p className="text-xs text-yellow-600 mt-1">
              Warning: You may need additional funds
            </p>
          )}
        </div>
      </div>
      
      <div className="h-80">
        {(assets.length > 0 || events.length > 0) ? (
          <canvas ref={chartRef}></canvas>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Add assets and liquidity events to see your timeline</p>
          </div>
        )}
      </div>
    </div>
  );
}