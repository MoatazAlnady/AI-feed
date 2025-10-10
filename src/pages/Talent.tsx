import { useTranslation } from 'react-i18next';

const Talent = () => {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">{t('talent.title')}</h1>
      <p className="text-muted-foreground">
        {t('talent.subtitle')}
      </p>
    </div>
  );
};

export default Talent;