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

  // Define recommendation categories
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
  };

  // Filter recommendations by category
  const filteredRecommendations = activeTab === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.category === activeTab);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
      
      {/* Tabs for recommendation categories */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 text-sm font-medium ${
              activeTab === 'all'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All
          </button>
          
          {Object.entries(categories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`py-2 px-1 text-sm font-medium ${
                activeTab === key
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Show description for selected category */}
      {activeTab !== 'all' && (
        <div className="bg-gray-50 p-3 rounded-md mb-4 text-sm text-gray-600">
          {categories[activeTab].description}
        </div>
      )}
      
      {/* Display recommendations */}
      {filteredRecommendations.length === 0 ? (
        <div className="py-8 text-center">
          {/* First-time user experience or educational content */}
          {activeTab === 'all' ? (
            <div>
              <p className="text-gray-500 mb-4">No recommendations generated yet.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(categories).map(([key, category]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium flex items-center">
                      <span className="text-xl mr-2">{category.icon}</span>
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-2">{category.description}</p>
                    <button
                      onClick={() => setActiveTab(key)}
                      className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Learn more
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">
              No {activeTab} recommendations at this time. 
              {activeTab === 'rollover' && " We'll suggest options when your assets approach maturity."}
              {activeTab === 'diversification' && " Add more assets to receive portfolio balance suggestions."}
              {activeTab === 'laddering' && " Laddering strategies will appear as you add more bonds."}
              {activeTab === 'liquidity' && " Add upcoming liquidity needs to get personalized recommendations."}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecommendations.map((rec, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-3 py-2">
              <div className="flex items-start">
                <span className="text-2xl mr-3">
                  {rec.category === 'rollover' && '🔄'}
                  {rec.category === 'diversification' && '📊'}
                  {rec.category === 'laddering' && '🪜'}
                  {rec.category === 'liquidity' && '💧'}
                </span>
                <div>
                  <h4 className="font-medium">{rec.title}</h4>
                  <p className="text-sm text-gray-600">{rec.description}</p>
                  
                  {rec.actionItems && rec.actionItems.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {rec.actionItems.map((item: string, i: number) => (
                        <li key={i} className="text-sm flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {rec.link && (
                    <a 
                      href={rec.link} 
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 mt-2 inline-block"
                    >
                      Learn more
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Educational content based on user's risk profile */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-800 mb-3">
          Educational Resources for {user.risk_tolerance.charAt(0).toUpperCase() + user.risk_tolerance.slice(1)} Investors
        </h3>
        <div className="space-y-2 text-sm">
          {user.risk_tolerance === 'conservative' && (
            <>
              <p>• Prioritize capital preservation with high-quality bonds and CDs</p>
              <p>• Consider Treasury securities for maximum safety</p>
              <p>• Laddering strategies can help balance yield and liquidity</p>
            </>
          )}
          
          {user.risk_tolerance === 'moderate' && (
            <>
              <p>• Balance safety and yield with a mix of government and corporate bonds</p>
              <p>• Investment-grade corporate bonds can offer higher yields</p>
              <p>• Consider adding some higher-yielding assets to your portfolio</p>
            </>
          )}
          
          {user.risk_tolerance === 'aggressive' && (
            <>
              <p>• High-yield corporate bonds can boost returns</p>
              <p>• Consider longer duration bonds for higher yield potential</p>
              <p>• Strategic laddering can help manage interest rate risk</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}