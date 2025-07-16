import React from 'react';
import Hero from '../components/Hero';
import FeaturedTools from '../components/FeaturedTools';
import Categories from '../components/CategoriesPreview';
import Newsletter from '../components/Newsletter';
import Stats from '../components/Stats';

const Home: React.FC = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <Hero />
      <Stats />
      <FeaturedTools />
      <Categories />
      <Newsletter />
    </div>
  );
};

export default Home;