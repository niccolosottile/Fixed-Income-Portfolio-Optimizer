'use client';
import { useState } from 'react';
import { CurrencyCode, FixedIncomeAsset, LiquidityEvent, User } from '@/types';
import { format, addMonths, isSameMonth } from 'date-fns';
import AssetForm from './AssetForm';
import OutflowForm from './OutflowForm';
import { formatCurrency } from '@/lib/utils';

interface LiquidityTimelineProps {
  events: LiquidityEvent[];
  assets: FixedIncomeAsset[];
  user: User;
}

export default function LiquidityTimeline({ events, assets, user }: LiquidityTimelineProps) {
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
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
      items: Array<{ 
        id?: string; 
        type: 'maturity' | 'event'; 
        name: string; 
        amount: number; 
        currency: string;
        date: Date; 
      }>
    }> = [];
    
    // Generate the next 24 months
    for (let i = 0; i < 24; i++) {
      const monthDate = addMonths(today, i);
      
      timeline.push({
        date: monthDate,
        month: format(monthDate, 'MMM yyyy'),
        inflows: 0,
        outflows: 0,
        currency: 'EUR', // Default currency, will be updated later
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
      
      const maturityValue = asset.face_value;
      
      // Add to inflows
      timelineEntry.inflows += maturityValue;
      
      // Add as an item
      timelineEntry.items.push({
        id: asset.id,
        type: 'maturity',
        name: asset.name,
        amount: maturityValue,
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
        id: event.id,
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
    
    // Filter out months with no cash flow
    return timeline.filter(month => month.inflows > 0 || month.outflows > 0);
  };

  const timelineData = generateMonthlyTimeline();

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
    const iconBaseClass = "w-5 h-5 flex items-center justify-center";
    if (netFlow > 0) {
      return (
        <div className={iconBaseClass}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="liquidity-timeline-icon text-emerald-600 dark:text-emerald-400">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    } else if (netFlow < 0) {
      return (
        <div className={iconBaseClass}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="liquidity-timeline-icon text-rose-600 dark:text-rose-400">
            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className={iconBaseClass}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="liquidity-timeline-icon text-gray-400">
            <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
  };

  // Handle deleting an event
  const handleDeleteEvent = async () => {
    if (!selectedEventId) return;
    
    setIsDeleting(true);
    setDeleteError('');
    
    try {
      const response = await fetch(`/api/liquidity-events?id=${selectedEventId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete liquidity event');
      }
      
      // Close the modal and refresh the page to show updated data
      setIsDeletingEvent(false);
      window.location.reload();
      
    } catch (error) {
      console.error('Error deleting liquidity event:', error);
      setDeleteError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Initialize the delete modal
  const openDeleteModal = (eventId: string) => {
    setSelectedEventId(eventId);
    setIsDeletingEvent(true);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Liquidity Timeline</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Next {timelineData.length} months with cash flows
          </p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
            <span className="text-sm text-gray-600 dark:text-gray-300">Inflows</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 dark:bg-rose-400"></span>
            <span className="text-sm text-gray-600 dark:text-gray-300">Outflows</span>
          </div>
        </div>
      </div>
      
      {timelineData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center flex-1">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="liquidity-timeline-empty-icon">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No upcoming cash flows</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md">
            Add fixed income assets with upcoming maturities or create liquidity events to see your future cash flow.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => setIsAddingAsset(true)} 
              className="btn-primary"
            >
              Add Asset
            </button>
            <button 
              onClick={() => setIsAddingEvent(true)}
              className="btn-outline"
            >
              Add Liquidity Event
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
          {timelineData.map((month, index) => (
            <div 
              key={month.month} 
              className={`rounded-lg border transition-colors ${
                index === 0 
                  ? 'bg-indigo-50/50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800/30' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="rounded-full bg-gray-200 dark:bg-gray-700 w-7 h-7 flex items-center justify-center mr-3 font-medium">
                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                      {format(month.date, 'MMM').charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm">
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
                      {formatCurrency(getNetFlow(month), month.currency as CurrencyCode)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Net flow
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {month.items.slice(0, 2).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 group">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                        item.type === 'maturity' 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                      }`}>
                        <span className="text-base leading-none">{item.type === 'maturity' ? '+' : '-'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-800 dark:text-gray-200 font-medium text-sm truncate max-w-[120px]">
                          {item.name}
                        </span>
                        {item.type === 'event' && item.id && (
                          <button 
                            onClick={() => openDeleteModal(item.id as string)}
                            className="ml-1.5 text-gray-400 hover:text-rose-500 dark:text-gray-500 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete event"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className={`font-medium text-sm ${item.type === 'maturity' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {item.type === 'maturity' ? '+' : '-'}{formatCurrency(item.amount, item.currency as CurrencyCode)}
                    </div>
                  </div>
                ))}
                {month.items.length > 2 && (
                  <div className="p-2 text-center text-xs text-gray-500 dark:text-gray-400">
                    +{month.items.length - 2} more transactions
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-b-lg border-t border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Inflows</div>
                    <div className="font-medium text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(month.inflows, month.currency as CurrencyCode)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Outflows</div>
                    <div className="font-medium text-rose-600 dark:text-rose-400">
                      -{formatCurrency(month.outflows, month.currency as CurrencyCode)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Only showing months with expected cash flows within the next 24 months.
        </div>
        <button
          onClick={() => setIsAddingEvent(true)}
          className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
        >
          + Add Outflow
        </button>
      </div>
      
      {/* Add Asset Modal */}
      {isAddingAsset && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="text-lg font-medium">Add New Asset</h2>
                <button 
                  onClick={() => setIsAddingAsset(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="modal-close-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <AssetForm 
                  userId={user.id} 
                  onAssetAdded={(asset) => {
                    setIsAddingAsset(false);
                    if (asset) {
                      window.location.reload();
                    }
                  }}
                  userCurrency={user.currency}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Event Modal */}
      {isAddingEvent && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-content max-w-md">
              <div className="modal-header">
                <h2 className="text-lg font-medium">Add Liquidity Outflow</h2>
                <button 
                  onClick={() => setIsAddingEvent(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="modal-close-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <OutflowForm 
                  userId={user.id} 
                  onEventAdded={(event) => {
                    setIsAddingEvent(false);
                    if (event) {
                      window.location.reload();
                    }
                  }}
                  userCurrency={user.currency as CurrencyCode}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Event Confirmation Modal */}
      {isDeletingEvent && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-content max-w-sm">
              <div className="modal-header">
                <h2 className="text-lg font-medium">Delete Liquidity Event</h2>
                <button 
                  onClick={() => setIsDeletingEvent(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="modal-close-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                {deleteError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-md text-red-800 dark:text-red-300">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Error:</span>
                    </div>
                    <p className="ml-7 mt-1">{deleteError}</p>
                  </div>
                )}
                
                <div className="text-center py-4">
                  <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Delete this liquidity event?
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    This action cannot be undone. The event will be permanently removed from your timeline.
                  </p>
                </div>
                
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setIsDeletingEvent(false)}
                    className="btn-secondary py-2 px-4"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteEvent}
                    className="btn-danger py-2 px-4 flex items-center justify-center"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      'Delete Event'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}