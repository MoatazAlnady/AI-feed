import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  FileText, 
  Users, 
  Briefcase, 
  Shield, 
  AlertTriangle, 
  CheckCircle2,
  XCircle,
  MessageSquare,
  Zap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';

const Guidelines = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isEmployer = user?.user_metadata?.account_type === 'employer';

  return (
    <div className="container max-w-5xl mx-auto py-8 px-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('guidelines.title')}</h1>
            <p className="text-muted-foreground">{t('guidelines.subtitle')}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue={isEmployer ? 'employers' : 'creators'} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="creators" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            {t('guidelines.forCreators')}
          </TabsTrigger>
          <TabsTrigger value="employers" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            {t('guidelines.forEmployers')}
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('guidelines.generalRules')}
          </TabsTrigger>
        </TabsList>

        {/* Creator Guidelines */}
        <TabsContent value="creators" className="space-y-6">
          {/* Tool Submission Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('guidelines.creators.toolSubmission.title')}
              </CardTitle>
              <CardDescription>
                {t('guidelines.creators.toolSubmission.desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.creators.toolSubmission.rule1')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.creators.toolSubmission.rule2')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.creators.toolSubmission.rule3')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.creators.toolSubmission.rule4')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Article Writing Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {t('guidelines.creators.articles.title')}
              </CardTitle>
              <CardDescription>
                {t('guidelines.creators.articles.desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.creators.articles.rule1')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.creators.articles.rule2')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.creators.articles.rule3')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.creators.articles.rule4')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Community Behavior */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('guidelines.creators.community.title')}
              </CardTitle>
              <CardDescription>
                {t('guidelines.creators.community.desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.creators.community.rule1')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.creators.community.rule2')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.creators.community.rule3')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.creators.community.rule4')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employer Guidelines */}
        <TabsContent value="employers" className="space-y-6">
          {/* Job Posting Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                {t('guidelines.employers.jobPosting.title')}
              </CardTitle>
              <CardDescription>
                {t('guidelines.employers.jobPosting.desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.employers.jobPosting.rule1')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.employers.jobPosting.rule2')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.employers.jobPosting.rule3')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.employers.jobPosting.rule4')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Talent Engagement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('guidelines.employers.talentEngagement.title')}
              </CardTitle>
              <CardDescription>
                {t('guidelines.employers.talentEngagement.desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.employers.talentEngagement.rule1')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.employers.talentEngagement.rule2')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.employers.talentEngagement.rule3')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Communication Standards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {t('guidelines.employers.communication.title')}
              </CardTitle>
              <CardDescription>
                {t('guidelines.employers.communication.desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.employers.communication.rule1')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.employers.communication.rule2')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.employers.communication.rule3')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Platform Rules */}
        <TabsContent value="general" className="space-y-6">
          {/* Terms of Service Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('guidelines.general.terms.title')}
              </CardTitle>
              <CardDescription>
                {t('guidelines.general.terms.desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.general.terms.rule1')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.general.terms.rule2')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.general.terms.rule3')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prohibited Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                {t('guidelines.general.prohibited.title')}
              </CardTitle>
              <CardDescription>
                {t('guidelines.general.prohibited.desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.general.prohibited.rule1')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.general.prohibited.rule2')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.general.prohibited.rule3')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.general.prohibited.rule4')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.general.prohibited.rule5')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('guidelines.general.privacy.title')}
              </CardTitle>
              <CardDescription>
                {t('guidelines.general.privacy.desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.general.privacy.rule1')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.general.privacy.rule2')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{t('guidelines.general.privacy.rule3')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consequences */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {t('guidelines.general.consequences.title')}
              </CardTitle>
              <CardDescription>
                {t('guidelines.general.consequences.desc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• {t('guidelines.general.consequences.item1')}</li>
                <li>• {t('guidelines.general.consequences.item2')}</li>
                <li>• {t('guidelines.general.consequences.item3')}</li>
                <li>• {t('guidelines.general.consequences.item4')}</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Guidelines;