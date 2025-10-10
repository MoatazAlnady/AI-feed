import React from 'react';
import { Zap, Users, Target, Globe, Award, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const About: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            {t('about.title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t('about.subtitle')}
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-foreground">{t('about.missionTitle')}</h2>
              <p className="text-lg text-muted-foreground mb-6">
                {t('about.missionText1')}
              </p>
              <p className="text-lg text-muted-foreground">
                {t('about.missionText2')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 bg-card rounded-lg border">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">{t('about.valueInnovation')}</h3>
                <p className="text-sm text-muted-foreground">{t('about.valueInnovationDesc')}</p>
              </div>
              <div className="text-center p-6 bg-card rounded-lg border">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">{t('about.valueCommunity')}</h3>
                <p className="text-sm text-muted-foreground">{t('about.valueCommunityDesc')}</p>
              </div>
              <div className="text-center p-6 bg-card rounded-lg border">
                <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">{t('about.valuePurpose')}</h3>
                <p className="text-sm text-muted-foreground">{t('about.valuePurposeDesc')}</p>
              </div>
              <div className="text-center p-6 bg-card rounded-lg border">
                <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">{t('about.valueGlobal')}</h3>
                <p className="text-sm text-muted-foreground">{t('about.valueGlobalDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-foreground">{t('about.ctaTitle')}</h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t('about.ctaDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/auth" 
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-200"
            >
              {t('about.getStarted')}
            </a>
            <a 
              href="/tools" 
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {t('about.exploreTools')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;