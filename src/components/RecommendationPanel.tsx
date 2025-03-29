'use client';
import { useState } from 'react';
import { User, Recommendation } from '@/types';

interface RecommendationPanelProps {
  recommendations: Recommendation[];
  user: User;
}

interface RecommendationCategory {
  name: string;
  icon: string;
  description: string;
}

export default function RecommendationPanel({ recommendations, user }: RecommendationPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // The user's country or default to global
  const userRegion = user?.country || 'global';
  
  // Define recommendation categories - expanded for global investors
  const categories: Record<string, RecommendationCategory> = {
    rollover: {
      name: 'Rollover',
      icon: '🔄',
      description: 'Recommendations for reinvesting maturing assets'
    },
    diversification: {
      name: 'Diversification',
      icon: '📊',
      description: 'Suggestions to improve portfolio balance'
    },
    laddering: {
      name: 'Bond Laddering',
      icon: '🪜',
      description: 'Strategies for staggering maturities to balance returns and liquidity'
    },
    liquidity: {
      name: 'Liquidity',
      icon: '💧',
      description: 'Recommendations for meeting upcoming liquidity needs'
    },
    currency: {
      name: 'Currency',
      icon: '💱',
      description: 'Currency diversification and hedging strategies'
    },
    regional: {
      name: 'Regional',
      icon: '🌍',
      description: 'Region-specific investment opportunities'
    },
    yield: {
      name: 'Yield',
      icon: '📈',
      description: 'Strategies for maximizing yield in the current interest rate environment'
    }
  };
  
  // Filter recommendations by category
  const filteredRecommendations = activeTab === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.category === activeTab);

  // Get badge color for categories
  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'rollover': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'diversification': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'laddering': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'liquidity': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300';
      case 'currency': return 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300';
      case 'regional': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'yield': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  // Get category icon element with color
  const getCategoryIcon = (category: string) => {
    const icon = categories[category]?.icon || '📋';
    return (
      <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${getCategoryColor(category)} text-lg`}>
        {icon}
      </span>
    );
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-100 dark:border-gray-700 mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recommendations</h2>
        
        {/* Tabs for recommendation categories */}
        <div className="flex overflow-x-auto hide-scrollbar -mx-1 mb-4">
          <div className="flex space-x-2 px-1 min-w-full">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-3 rounded text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'all'
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              All
            </button>
            
            {Object.entries(categories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`py-2 px-3 rounded text-sm font-medium whitespace-nowrap transition-colors flex items-center space-x-1 ${
                  activeTab === key
                    ? `${getCategoryColor(key)}`
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {/* Show description for selected category */}
        {activeTab !== 'all' && (
          <div className="bg-gray-50/50 dark:bg-gray-800/30 p-3 rounded-lg mb-4 flex items-start border border-gray-100 dark:border-gray-700/50">
            <div className="mr-3 mt-0.5">
              {getCategoryIcon(activeTab)}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {categories[activeTab]?.name} Recommendations
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {categories[activeTab]?.description}
              </p>
            </div>
          </div>
        )}
        {/* Empty state */}
        {recommendations.length === 0 && (
          <div className="flex flex-col items-center text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 mb-4">
              {categories[activeTab]?.icon || '📋'}
            </div>
            <h4 className="text-gray-900 dark:text-white font-medium mb-1">
              No {activeTab} recommendations
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
              {activeTab === 'rollover' && "We'll suggest options when your assets approach maturity."}
              {activeTab === 'diversification' && "Add more assets to receive portfolio balance suggestions."}
              {activeTab === 'laddering' && "Laddering strategies will appear as you add more bonds."}
              {activeTab === 'liquidity' && "Add upcoming liquidity needs to get personalized recommendations."}
              {activeTab === 'currency' && "Add assets with different currencies to see currency management strategies."}
              {activeTab === 'regional' && "Add assets from different regions to see regional diversification tips."}
              {activeTab === 'yield' && "Add more assets to receive personalized yield optimization suggestions."}
              {activeTab === 'all' && "Add more assets to your portfolio to receive tailored recommendations."}
            </p>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 w-full border border-gray-100 dark:border-gray-700/50">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Get started by adding assets to your portfolio to receive tailored recommendations.
              </div>
            </div>
          </div>
        )}
        {/* Recommendations list */}
        {recommendations.length > 0 && (
          <div className="space-y-3">
            {filteredRecommendations.map((rec, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border-l-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                style={{ borderLeftColor: rec.category === 'rollover' ? '#60a5fa' : 
                                        rec.category === 'diversification' ? '#818cf8' :
                                        rec.category === 'laddering' ? '#fbbf24' :
                                        rec.category === 'liquidity' ? '#22d3ee' :
                                        rec.category === 'currency' ? '#d946ef' :
                                        rec.category === 'regional' ? '#10b981' :
                                        rec.category === 'yield' ? '#f43f5e' : '#9ca3af' }}
              >
                <div className="flex items-start">
                  <div className="mr-3 flex-shrink-0">
                    {getCategoryIcon(rec.category)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">{rec.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{rec.description}</p>
                    
                    {rec.actionItems && rec.actionItems.length > 0 && (
                      <ul className="space-y-2 mb-3">
                        {rec.actionItems.map((item: string, i: number) => (
                          <li key={i} className="text-sm flex items-start bg-gray-50 dark:bg-gray-700/30 p-2 rounded-md">
                            <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </span>
                            <span className="text-gray-800 dark:text-gray-200">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    {rec.link && (
                      <a 
                        href={rec.link} 
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Learn more
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Educational content based on user's region and risk profile */}
      {recommendations.length > 0 && (
        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-2 px-4">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Fixed Income Insights for {user.risk_tolerance.charAt(0).toUpperCase() + user.risk_tolerance.slice(1)} Investors
            </div>
          </h3>
          <div className="px-4 pb-4">
            <RegionalEducationalContent category="general" userRegion={userRegion} risk={user.risk_tolerance} />
          </div>
        </div>
      )}
    </div>
  );
}

// Component to display region-specific educational content
function RegionalEducationalContent({ 
  category, 
  userRegion, 
  risk 
}: { 
  category: string; 
  userRegion: string;
  risk: string;
}) {
  // Risk level specific content
  const riskContent = () => {
    switch (risk) {
      case 'conservative':
        return (
          <div className="space-y-2 text-sm">
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Prioritize capital preservation with high-quality government bonds
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Consider inflation-linked bonds to protect purchasing power
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Laddering strategies can help balance yield and liquidity
            </p>
          </div>
        );
      case 'moderate':
        return (
          <div className="space-y-2 text-sm">
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Balance safety and yield with a mix of government and corporate bonds
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Consider investment-grade corporate bonds for higher yields
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Diversify across multiple countries for stability
            </p>
          </div>
        );
      case 'aggressive':
        return (
          <div className="space-y-2 text-sm">
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Higher-yielding corporate bonds can enhance returns
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Consider subordinated bank debt and financial institution bonds
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Emerging market government bonds offer higher yields with controlled risk
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  // Category specific content
  if (category === 'currency') {
    return (
      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
        <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Currency Management Strategies:</h4>
        {userRegion === 'eurozone' && (
          <div className="space-y-2">
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Consider some GBP or USD allocation for diversification from EUR
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Currency-hedged bonds from other regions can reduce volatility
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              European bonds denominated in foreign currencies can offer yield premium
            </p>
          </div>
        )}
        {userRegion === 'uk' && (
          <div className="space-y-2">
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              EUR-denominated bonds from strong European issuers may be attractive
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Consider USD Treasury allocation for stability alongside GBP gilts
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Currency-hedged European corporate bonds can reduce Brexit-related volatility
            </p>
          </div>
        )}
        {userRegion !== 'eurozone' && userRegion !== 'uk' && (
          <div className="space-y-2">
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Diversification across EUR, GBP, and USD reduces currency risk
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Consider currency-hedged options for foreign bond investments
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Local currency emerging market bonds can offer yield premium
            </p>
          </div>
        )}
      </div>
    );
  }
  
  if (category === 'regional') {
    return (
      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
        <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Regional Investment Focus:</h4>
        {userRegion === 'eurozone' && (
          <div className="space-y-2">
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Core Eurozone sovereign bonds (Germany, France, Netherlands) offer safety
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Peripheral bonds (Italy, Spain, Portugal) provide higher yields
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              European corporate bonds benefit from ECB support programs
            </p>
          </div>
        )}
        {userRegion === 'uk' && (
          <div className="space-y-2">
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              UK Gilts provide domestic currency stability
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              UK corporate bonds offer additional yield over gilts
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Consider European investment grade corporate bonds for diversification
            </p>
          </div>
        )}
        {userRegion !== 'eurozone' && userRegion !== 'uk' && (
          <div className="space-y-2">
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              US Treasuries offer global benchmark for safety
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              European government bonds provide exposure to different economic cycles
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              UK Gilts can offer diversification from Euro and Dollar assets
            </p>
          </div>
        )}
      </div>
    );
  }
  
  if (category === 'yield') {
    return (
      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
        <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Yield Enhancement Strategies:</h4>
        {userRegion === 'eurozone' && (
          <div className="space-y-2">
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Consider longer-dated peripheral Eurozone bonds for yield pickup
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Subordinated bonds from strong European banks can offer attractive yields
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              European corporate bonds offer premium over negative-yielding government debt
            </p>
          </div>
        )}
        {userRegion === 'uk' && (
          <div className="space-y-2">
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Investment-grade UK corporate bonds offer yield advantage over gilts
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Longer-dated gilts provide term premium
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Consider inflation-linked gilts for real return protection
            </p>
          </div>
        )}
        {userRegion !== 'eurozone' && userRegion !== 'uk' && (
          <div className="space-y-2">
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Corporate bonds typically offer yield premium over government securities
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Extending duration can increase yields in a normal yield curve environment
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Diversifying into different markets can capture regional yield advantages
            </p>
          </div>
        )}
      </div>
    );
  }
  
   // Default general content
   return (
    <div className="text-sm text-gray-700 dark:text-gray-300">
      {userRegion === 'eurozone' ? (
        <div className="space-y-2">
          {riskContent()}
          <div className="mt-3 space-y-2">
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              European inflation-linked bonds offer protection against ECB policies
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Consider mixing core (German, Dutch) and peripheral (Italian, Spanish) government bonds
            </p>
          </div>
        </div>
      ) : userRegion === 'uk' ? (
        <div className="space-y-2">
          {riskContent()}
          <div className="mt-3 space-y-2">
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              UK Gilts and inflation-linked bonds (linkers) provide domestic stability
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Consider European bonds for post-Brexit portfolio diversification
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {riskContent()}
          <div className="mt-3 space-y-2">
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              International diversification improves risk-adjusted returns
            </p>
            <p className="flex items-start">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5">•</span>
              Consider both USD and EUR denominated securities for global exposure
            </p>
          </div>
        </div>
      )}
    </div>
  );
}