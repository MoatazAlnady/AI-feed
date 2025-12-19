import { useTranslation } from 'react-i18next';
import SEOHead from '@/components/SEOHead';

const Talent = () => {
  const { t } = useTranslation();
  return (
    <>
      <SEOHead
        title="AI Talent - Connect with AI Professionals & Experts"
        description="Discover and connect with top AI professionals, machine learning experts, and data scientists. Find the right talent for your AI projects and collaborations."
        keywords="AI talent, AI professionals, machine learning experts, data scientists, AI experts, hire AI engineers"
        url="https://aifeed.app/talent"
        type="website"
      />
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">{t('talent.title')}</h1>
        <p className="text-muted-foreground">
          {t('talent.subtitle')}
        </p>
      </div>
    </>
  );
};

export default Talent;