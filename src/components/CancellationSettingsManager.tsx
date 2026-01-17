import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Trash2, 
  Edit, 
  GripVertical, 
  HelpCircle,
  Gift,
  ToggleLeft,
  Percent,
  Calendar,
  ChevronDown,
  ChevronUp,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface CancellationQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: { value: string; label: string }[] | null;
  is_mandatory: boolean;
  order_index: number;
  is_active: boolean;
}

interface RetentionOffer {
  id: string;
  offer_type: 'unconditional' | 'conditional';
  title: string;
  description: string | null;
  discount_percent: number | null;
  discount_months: number | null;
  free_months: number | null;
  condition_rules: {
    question_id: string;
    answer_values: string[];
    operator: 'equals' | 'contains' | 'greater_than';
  } | null;
  priority: number;
  is_active: boolean;
}

const QUESTION_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'select', label: 'Dropdown' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'number', label: 'Number' },
  { value: 'rating', label: 'Rating (1-5)' },
];

const CancellationSettingsManager: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<CancellationQuestion[]>([]);
  const [offers, setOffers] = useState<RetentionOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Question form state
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<CancellationQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'text',
    options: '',
    is_mandatory: false,
  });
  
  // Offer form state
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<RetentionOffer | null>(null);
  const [offerForm, setOfferForm] = useState({
    offer_type: 'unconditional' as 'unconditional' | 'conditional',
    title: '',
    description: '',
    discount_percent: '',
    discount_months: '',
    free_months: '',
    condition_question_id: '',
    condition_answer_values: '',
    condition_operator: 'equals' as 'equals' | 'contains' | 'greater_than',
    priority: '0',
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'question' | 'offer'; id: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [questionsRes, offersRes] = await Promise.all([
        supabase
          .from('creator_cancellation_questions')
          .select('*')
          .eq('creator_id', user?.id)
          .order('order_index', { ascending: true }),
        supabase
          .from('creator_retention_offers')
          .select('*')
          .eq('creator_id', user?.id)
          .order('priority', { ascending: false })
      ]);

      if (questionsRes.error) throw questionsRes.error;
      if (offersRes.error) throw offersRes.error;

      setQuestions((questionsRes.data || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options as { value: string; label: string }[] : null
      })));
      setOffers((offersRes.data || []).map(o => ({
        ...o,
        offer_type: o.offer_type as 'unconditional' | 'conditional',
        condition_rules: o.condition_rules as RetentionOffer['condition_rules']
      })));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const hasOptionsField = (type: string) => {
    return ['select', 'multiselect', 'radio', 'checkbox'].includes(type);
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.question_text.trim()) {
      toast.error('Question text is required');
      return;
    }

    setSaving(true);
    try {
      const options = hasOptionsField(questionForm.question_type) 
        ? questionForm.options.split('\n').filter(o => o.trim()).map((o, i) => ({ value: `option_${i}`, label: o.trim() }))
        : null;

      if (editingQuestion) {
        const { error } = await supabase
          .from('creator_cancellation_questions')
          .update({
            question_text: questionForm.question_text,
            question_type: questionForm.question_type,
            options,
            is_mandatory: questionForm.is_mandatory,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingQuestion.id);

        if (error) throw error;
        toast.success('Question updated');
      } else {
        const { error } = await supabase
          .from('creator_cancellation_questions')
          .insert({
            creator_id: user?.id,
            question_text: questionForm.question_text,
            question_type: questionForm.question_type,
            options,
            is_mandatory: questionForm.is_mandatory,
            order_index: questions.length,
          });

        if (error) throw error;
        toast.success('Question added');
      }

      resetQuestionForm();
      fetchData();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOffer = async () => {
    if (!offerForm.title.trim()) {
      toast.error('Offer title is required');
      return;
    }

    setSaving(true);
    try {
      const condition_rules = offerForm.offer_type === 'conditional' && offerForm.condition_question_id
        ? {
            question_id: offerForm.condition_question_id,
            answer_values: offerForm.condition_answer_values.split(',').map(v => v.trim()),
            operator: offerForm.condition_operator,
          }
        : null;

      const offerData = {
        creator_id: user?.id,
        offer_type: offerForm.offer_type,
        title: offerForm.title,
        description: offerForm.description || null,
        discount_percent: offerForm.discount_percent ? parseInt(offerForm.discount_percent) : null,
        discount_months: offerForm.discount_months ? parseInt(offerForm.discount_months) : null,
        free_months: offerForm.free_months ? parseInt(offerForm.free_months) : null,
        condition_rules,
        priority: parseInt(offerForm.priority) || 0,
      };

      if (editingOffer) {
        const { error } = await supabase
          .from('creator_retention_offers')
          .update(offerData)
          .eq('id', editingOffer.id);

        if (error) throw error;
        toast.success('Offer updated');
      } else {
        const { error } = await supabase
          .from('creator_retention_offers')
          .insert(offerData);

        if (error) throw error;
        toast.success('Offer added');
      }

      resetOfferForm();
      fetchData();
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Failed to save offer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const table = deleteConfirm.type === 'question' 
        ? 'creator_cancellation_questions' 
        : 'creator_retention_offers';
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', deleteConfirm.id);

      if (error) throw error;
      toast.success(`${deleteConfirm.type === 'question' ? 'Question' : 'Offer'} deleted`);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleToggleActive = async (type: 'question' | 'offer', id: string, isActive: boolean) => {
    try {
      const table = type === 'question' 
        ? 'creator_cancellation_questions' 
        : 'creator_retention_offers';
      
      const { error } = await supabase
        .from(table)
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error toggling:', error);
    }
  };

  const editQuestion = (question: CancellationQuestion) => {
    setEditingQuestion(question);
    setQuestionForm({
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options?.map(o => o.label).join('\n') || '',
      is_mandatory: question.is_mandatory,
    });
    setShowQuestionForm(true);
  };

  const editOffer = (offer: RetentionOffer) => {
    setEditingOffer(offer);
    setOfferForm({
      offer_type: offer.offer_type,
      title: offer.title,
      description: offer.description || '',
      discount_percent: offer.discount_percent?.toString() || '',
      discount_months: offer.discount_months?.toString() || '',
      free_months: offer.free_months?.toString() || '',
      condition_question_id: offer.condition_rules?.question_id || '',
      condition_answer_values: offer.condition_rules?.answer_values.join(', ') || '',
      condition_operator: offer.condition_rules?.operator || 'equals',
      priority: offer.priority.toString(),
    });
    setShowOfferForm(true);
  };

  const resetQuestionForm = () => {
    setQuestionForm({ question_text: '', question_type: 'text', options: '', is_mandatory: false });
    setEditingQuestion(null);
    setShowQuestionForm(false);
  };

  const resetOfferForm = () => {
    setOfferForm({
      offer_type: 'unconditional',
      title: '',
      description: '',
      discount_percent: '',
      discount_months: '',
      free_months: '',
      condition_question_id: '',
      condition_answer_values: '',
      condition_operator: 'equals',
      priority: '0',
    });
    setEditingOffer(null);
    setShowOfferForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ToggleLeft className="h-5 w-5 text-primary" />
          {t('creator.cancellation.title', 'Cancellation Settings')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('creator.cancellation.description', 'Customize the cancellation experience for your subscribers')}
        </p>
      </div>

      <Tabs defaultValue="questions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="questions" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Questions ({questions.length})
          </TabsTrigger>
          <TabsTrigger value="offers" className="gap-2">
            <Gift className="h-4 w-4" />
            Retention Offers ({offers.length})
          </TabsTrigger>
        </TabsList>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Ask subscribers why they're cancelling to gather feedback
            </p>
            {!showQuestionForm && (
              <Button onClick={() => setShowQuestionForm(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Question
              </Button>
            )}
          </div>

          {showQuestionForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingQuestion ? 'Edit Question' : 'New Question'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Question Text *</Label>
                  <Input
                    value={questionForm.question_text}
                    onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                    placeholder="e.g., Why are you cancelling?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Question Type</Label>
                    <Select
                      value={questionForm.question_type}
                      onValueChange={(value) => setQuestionForm({ ...questionForm, question_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {QUESTION_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      checked={questionForm.is_mandatory}
                      onCheckedChange={(checked) => setQuestionForm({ ...questionForm, is_mandatory: checked })}
                    />
                    <Label>Required</Label>
                  </div>
                </div>

                {hasOptionsField(questionForm.question_type) && (
                  <div className="space-y-2">
                    <Label>Options (one per line)</Label>
                    <Textarea
                      value={questionForm.options}
                      onChange={(e) => setQuestionForm({ ...questionForm, options: e.target.value })}
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                      rows={4}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetQuestionForm}>Cancel</Button>
                  <Button onClick={handleSaveQuestion} disabled={saving}>
                    <Save className="h-4 w-4 mr-1" />
                    {saving ? 'Saving...' : 'Save Question'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {questions.length === 0 ? (
            <div className="text-center py-8 bg-muted/50 rounded-lg">
              <HelpCircle className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No cancellation questions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className={`flex items-center gap-3 p-4 bg-card border border-border rounded-lg ${!question.is_active ? 'opacity-60' : ''}`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{question.question_text}</span>
                      {question.is_mandatory && (
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Type: {QUESTION_TYPES.find(t => t.value === question.question_type)?.label}
                      {question.options && ` • ${question.options.length} options`}
                    </p>
                  </div>
                  <Switch
                    checked={question.is_active}
                    onCheckedChange={(checked) => handleToggleActive('question', question.id, checked)}
                  />
                  <Button variant="ghost" size="icon" onClick={() => editQuestion(question)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive"
                    onClick={() => setDeleteConfirm({ type: 'question', id: question.id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Offers Tab */}
        <TabsContent value="offers" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Offer incentives to retain subscribers who want to cancel
            </p>
            {!showOfferForm && (
              <Button onClick={() => setShowOfferForm(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Offer
              </Button>
            )}
          </div>

          {showOfferForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingOffer ? 'Edit Offer' : 'New Retention Offer'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Offer Type</Label>
                  <Select
                    value={offerForm.offer_type}
                    onValueChange={(value: 'unconditional' | 'conditional') => 
                      setOfferForm({ ...offerForm, offer_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unconditional">Unconditional (shown to everyone)</SelectItem>
                      <SelectItem value="conditional">Conditional (based on answers)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Offer Title *</Label>
                  <Input
                    value={offerForm.title}
                    onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                    placeholder="e.g., Stay and save 50%!"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={offerForm.description}
                    onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                    placeholder="Describe what the subscriber gets..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      Discount %
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={offerForm.discount_percent}
                      onChange={(e) => setOfferForm({ ...offerForm, discount_percent: e.target.value })}
                      placeholder="e.g., 50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      For Months
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={offerForm.discount_months}
                      onChange={(e) => setOfferForm({ ...offerForm, discount_months: e.target.value })}
                      placeholder="e.g., 2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Free Months</Label>
                    <Input
                      type="number"
                      min="0"
                      value={offerForm.free_months}
                      onChange={(e) => setOfferForm({ ...offerForm, free_months: e.target.value })}
                      placeholder="e.g., 1"
                    />
                  </div>
                </div>

                {offerForm.offer_type === 'conditional' && questions.length > 0 && (
                  <Card className="bg-muted/50">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Condition Rules</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label>Show when question</Label>
                        <Select
                          value={offerForm.condition_question_id}
                          onValueChange={(value) => setOfferForm({ ...offerForm, condition_question_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a question" />
                          </SelectTrigger>
                          <SelectContent>
                            {questions.map(q => (
                              <SelectItem key={q.id} value={q.id}>
                                {q.question_text}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Operator</Label>
                          <Select
                            value={offerForm.condition_operator}
                            onValueChange={(value: 'equals' | 'contains' | 'greater_than') => 
                              setOfferForm({ ...offerForm, condition_operator: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">Equals</SelectItem>
                              <SelectItem value="contains">Contains</SelectItem>
                              <SelectItem value="greater_than">Greater Than</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Values (comma-separated)</Label>
                          <Input
                            value={offerForm.condition_answer_values}
                            onChange={(e) => setOfferForm({ ...offerForm, condition_answer_values: e.target.value })}
                            placeholder="value1, value2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  <Label>Priority (higher = shown first)</Label>
                  <Input
                    type="number"
                    value={offerForm.priority}
                    onChange={(e) => setOfferForm({ ...offerForm, priority: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetOfferForm}>Cancel</Button>
                  <Button onClick={handleSaveOffer} disabled={saving}>
                    <Save className="h-4 w-4 mr-1" />
                    {saving ? 'Saving...' : 'Save Offer'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {offers.length === 0 ? (
            <div className="text-center py-8 bg-muted/50 rounded-lg">
              <Gift className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No retention offers yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className={`p-4 bg-card border border-border rounded-lg ${!offer.is_active ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{offer.title}</span>
                        <Badge variant={offer.offer_type === 'unconditional' ? 'default' : 'secondary'}>
                          {offer.offer_type}
                        </Badge>
                        {!offer.is_active && <Badge variant="outline">Inactive</Badge>}
                      </div>
                      {offer.description && (
                        <p className="text-sm text-muted-foreground mt-1">{offer.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {offer.discount_percent && (
                          <span className="flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            {offer.discount_percent}% off
                          </span>
                        )}
                        {offer.discount_months && (
                          <span>for {offer.discount_months} months</span>
                        )}
                        {offer.free_months && (
                          <span>{offer.free_months} free month(s)</span>
                        )}
                        <span>Priority: {offer.priority}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={offer.is_active}
                        onCheckedChange={(checked) => handleToggleActive('offer', offer.id, checked)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => editOffer(offer)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
                        onClick={() => setDeleteConfirm({ type: 'offer', id: offer.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteConfirm?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this {deleteConfirm?.type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CancellationSettingsManager;
