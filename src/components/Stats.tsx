import React, { useState, useEffect } from 'react';
import { Users, Zap, Star, TrendingUp } from 'lucide-react';

const Stats: React.FC = () => {
  const [stats, setStats] = useState({
    toolsCount: 0,
    usersCount: 0,
    rating: 0,
    newToolsMonthly: 0
  });

  useEffect(() => {
    // In real app, fetch actual stats from API
    // For now, all stats start at 0 until real data is available
    const fetchStats = async () => {
      try {
        // const response = await fetch('/api/stats');
        // const data = await response.json();
        // setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const statsData = [
    {
      icon: Zap,
      number: stats.toolsCount.toLocaleString(),
      label: 'AI Tools',
      description: 'Curated and categorized'
    },
    {
      icon: Users,
      number: stats.usersCount.toLocaleString(),
      label: 'Active Users',
      description: 'Growing community'
    },
    {
      icon: Star,
      number: stats.rating > 0 ? `${stats.rating}/5` : '0/5',
      label: 'User Rating',
      description: 'Highly recommended'
    },
    {
      icon: TrendingUp,
      number: stats.newToolsMonthly.toLocaleString(),
      label: 'New Tools',
      description: 'Added monthly'
    }
  ];

  return (
    <section className="py-16 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {statsData.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl mb-4 group-hover:shadow-lg transition-shadow">
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.number}
              </div>
              <div className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
                {stat.label}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;