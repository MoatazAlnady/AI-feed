import Hero from '@/app/components/Hero'
import FeaturedTools from '@/app/components/FeaturedTools'
import CategoriesPreview from '@/app/components/CategoriesPreview'
import Newsletter from '@/app/components/Newsletter'
import Stats from '@/app/components/Stats'

export default function Home() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <Hero />
      <Stats />
      <FeaturedTools />
      <CategoriesPreview />
      <Newsletter />
    </div>
  )
}