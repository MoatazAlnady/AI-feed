import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const PaymentCanceled: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center py-12 px-4">
      <Card className="max-w-lg w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 p-4 bg-muted rounded-full w-fit">
            <XCircle className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">
            {t('paymentCanceled.title', 'Payment Canceled')}
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            {t('paymentCanceled.description', "No worries! Your payment was not processed. You can try again whenever you're ready.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              {t('paymentCanceled.info', "If you experienced any issues during checkout or have questions about our premium plans, we're here to help.")}
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button 
              onClick={() => navigate('/upgrade')}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
              size="lg"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('paymentCanceled.tryAgain', 'Try Again')}
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/newsfeed')}
              className="w-full"
            >
              {t('paymentCanceled.backToFeed', 'Back to News Feed')}
            </Button>
            <Button 
              variant="ghost"
              onClick={() => navigate('/settings')}
              className="w-full"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              {t('paymentCanceled.contactSupport', 'Contact Support')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCanceled;
