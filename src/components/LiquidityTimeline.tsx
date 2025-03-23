'use client';
import { FixedIncomeAsset, LiquidityEvent } from '@/types';
import { format, addMonths, isSameMonth } from 'date-fns';

interface LiquidityTimelineProps {
  events: LiquidityEvent[];
  assets: FixedIncomeAsset[];
}

export default function LiquidityTimeline({ events, assets }: LiquidityTimelineProps) {
  const today = new Date();
  
  // Generate timeline for the next 24 months, merging both liquidity events 
  // and upcoming bond maturities
  const generateMonthlyTimeline = () => {
    const timeline: Array<{
      date: Date;
      month: string;
      inflows: number;
      outflows: number;
      currency: string;
      items: Array<{ type: 'maturity' | 'event'; name: string; amount: number; date: Date; currency: string }>
    }> = [];
    
    // Generate the next 24 months
    for (let i = 0; i < 24; i++) {
      const monthDate = addMonths(today, i);
      
      timeline.push({
        date: monthDate,
        month: format(monthDate, 'MMM yyyy'),
        inflows: 0,
        outflows: 0,
        currency: 'EUR', // Default, will be updated when we add items
        items: []
      });
    }
    
    // Add asset maturities (inflows)
    assets.forEach(asset => {
      const maturityDate = new Date(asset.maturity_date);
      // Skip assets that are already matured
      if (maturityDate < today) return;
      
      // Find the timeline entry for this month
      const timelineEntry = timeline.find(t => isSameMonth(t.date, maturityDate));
      if (!timelineEntry) return; // Outside our 24 month window
      
      // Add to inflows
      timelineEntry.inflows += asset.face_value;
      
      // Add as an item
      timelineEntry.items.push({
        type: 'maturity',
        name: asset.name,
        amount: asset.face_value,
        date: maturityDate,
        currency: asset.currency
      });
      
      // Update currency for the month if needed
      if (timelineEntry.inflows > 0) {
        timelineEntry.currency = asset.currency;
      }
    });
    
    // Add liquidity events (outflows)
    events.forEach(event => {
      const eventDate = new Date(event.date);
      // Skip past events
      if (eventDate < today) return;
      
      // Find the timeline entry for this month
      const timelineEntry = timeline.find(t => isSameMonth(t.date, eventDate));
      if (!timelineEntry) return; // Outside our 24 month window
      
      // Add to outflows
      timelineEntry.outflows += event.amount;
      
      // Add as an item
      timelineEntry.items.push({
        type: 'event',
        name: event.description,
        amount: event.amount,
        date: eventDate,
        currency: event.currency
      });
      
      // Update currency for the month
      if (timelineEntry.outflows > timelineEntry.inflows) {
        timelineEntry.currency = event.currency;
      }
    });
    
    return timeline.filter(month => month.inflows > 0 || month.outflows > 0);
  };

  const timelineData = generateMonthlyTimeline();

  // Format currency for display
  const formatCurrency = (amount: number, currencyCode = 'EUR'): string => {
    const locale = currencyCode === 'EUR' ? 'de-DE' : 
                 currencyCode === 'GBP' ? 'en-GB' : 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate the net flow (positive or negative) for a month
  const getNetFlow = (month: typeof timelineData[0]): number => {
    return month.inflows - month.outflows;
  };

  // Determine the color based on net flow
  const getFlowColor = (netFlow: number): string => {
    return netFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
  };

  // Determine the icon based on net flow
  const getFlowIcon = (netFlow: number) => {
    if (netFlow > 0) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      );
    } else if (netFlow < 0) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-600 dark:text-rose-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  return (
    <div className="saas-card p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Liquidity Timeline</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Next {timelineData.length} months with cash flows
          </p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center text-sm">
          <div className="flex items-center mr-4">
            <span className="w-3 h-3 rounded-full bg-emerald-500 mr-1.5"></span>
            <span className="text-gray-600 dark:text-gray-300">Inflows</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-rose-500 mr-1.5"></span>
            <span className="text-gray-600 dark:text-gray-300">Outflows</span>
          </div>
        </div>
      </div>
      
      {timelineData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No upcoming cash flows</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            Add fixed income assets with upcoming maturities or create liquidity events to see your future cash flow.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="btn-outline">
              Add Asset
            </button>
            <button className="btn-outline">
              Add Liquidity Event
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {timelineData.map((month, index) => (
            <div 
              key={month.month} 
              className={`rounded border ${index === 0 ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800/30' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="rounded-full bg-gray-200 dark:bg-gray-700 w-10 h-10 flex items-center justify-center mr-3">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {format(month.date, 'MMM').charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {month.month}
                    </h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {month.items.length} {month.items.length === 1 ? 'transaction' : 'transactions'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="mr-2">
                    {getFlowIcon(getNetFlow(month))}
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${getFlowColor(getNetFlow(month))}`}>
                      {formatCurrency(getNetFlow(month), month.currency)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Net flow
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                {month.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      {item.type === 'maturity' ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                          <span className="text-emerald-600 text-xs">+</span>
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center mr-3">
                          <span className="text-rose-600 text-xs">-</span>
                        </div>
                      )}
                      <span className="text-gray-800 dark:text-gray-200">
                        {item.name}
                      </span>
                    </div>
                    <div className={`font-medium ${item.type === 'maturity' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {item.type === 'maturity' ? '+' : '-'}
                      {formatCurrency(item.amount, item.currency)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-b-lg border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm">
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Inflows</div>
                  <div className="font-medium text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(month.inflows, month.currency)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-500 dark:text-gray-400">Outflows</div>
                  <div className="font-medium text-rose-600 dark:text-rose-400">
                    -{formatCurrency(month.outflows, month.currency)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {timelineData.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          Only showing months with expected cash flows within the next 24 months.
        </div>
      )}
    </div>
  );
}