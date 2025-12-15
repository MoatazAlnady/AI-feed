import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Phone, ExternalLink, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CountryCode {
  id: string;
  country_code: string;
  country_name: string;
  phone_code: string;
  created_at: string;
}

const DropdownListsManagement: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [countryCodes, setCountryCodes] = useState<CountryCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<CountryCode | null>(null);
  const [formData, setFormData] = useState({
    country_code: '',
    country_name: '',
    phone_code: ''
  });

  useEffect(() => {
    fetchCountryCodes();
  }, []);

  const fetchCountryCodes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('country_codes')
        .select('*')
        .order('country_name', { ascending: true });

      if (error) throw error;
      setCountryCodes(data || []);
    } catch (error) {
      console.error('Error fetching country codes:', error);
      toast({
        title: t('admin.error'),
        description: t('admin.fetchError'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCountry = async () => {
    try {
      const { error } = await supabase
        .from('country_codes')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: t('admin.success'),
        description: t('admin.countryCodeAdded')
      });
      setIsAddDialogOpen(false);
      setFormData({ country_code: '', country_name: '', phone_code: '' });
      fetchCountryCodes();
    } catch (error: any) {
      console.error('Error adding country code:', error);
      toast({
        title: t('admin.error'),
        description: error.message || t('admin.addError'),
        variant: 'destructive'
      });
    }
  };

  const handleEditCountry = async () => {
    if (!editingCountry) return;

    try {
      const { error } = await supabase
        .from('country_codes')
        .update(formData)
        .eq('id', editingCountry.id);

      if (error) throw error;

      toast({
        title: t('admin.success'),
        description: t('admin.countryCodeUpdated')
      });
      setIsEditDialogOpen(false);
      setEditingCountry(null);
      setFormData({ country_code: '', country_name: '', phone_code: '' });
      fetchCountryCodes();
    } catch (error: any) {
      console.error('Error updating country code:', error);
      toast({
        title: t('admin.error'),
        description: error.message || t('admin.updateError'),
        variant: 'destructive'
      });
    }
  };

  const handleDeleteCountry = async (id: string) => {
    if (!confirm(t('admin.confirmDelete'))) return;

    try {
      const { error } = await supabase
        .from('country_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: t('admin.success'),
        description: t('admin.countryCodeDeleted')
      });
      fetchCountryCodes();
    } catch (error: any) {
      console.error('Error deleting country code:', error);
      toast({
        title: t('admin.error'),
        description: error.message || t('admin.deleteError'),
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (country: CountryCode) => {
    setEditingCountry(country);
    setFormData({
      country_code: country.country_code,
      country_name: country.country_name,
      phone_code: country.phone_code
    });
    setIsEditDialogOpen(true);
  };

  const filteredCountryCodes = countryCodes.filter(country =>
    country.country_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.country_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.phone_code.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('admin.dropdownLists')}</h2>
        <p className="text-muted-foreground">{t('admin.dropdownListsDescription')}</p>
      </div>

      <Tabs defaultValue="country-codes" className="w-full">
        <TabsList>
          <TabsTrigger value="country-codes" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            {t('admin.countryCodes')}
          </TabsTrigger>
          <TabsTrigger value="quick-links" className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            {t('admin.quickLinks')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="country-codes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('admin.countryCodes')}</CardTitle>
                  <CardDescription>{t('admin.countryCodesDescription')}</CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('admin.addCountryCode')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('admin.addCountryCode')}</DialogTitle>
                      <DialogDescription>{t('admin.addCountryCodeDescription')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t('admin.countryName')}</Label>
                        <Input
                          value={formData.country_name}
                          onChange={(e) => setFormData({ ...formData, country_name: e.target.value })}
                          placeholder="United States"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('admin.countryCode')}</Label>
                        <Input
                          value={formData.country_code}
                          onChange={(e) => setFormData({ ...formData, country_code: e.target.value.toUpperCase() })}
                          placeholder="US"
                          maxLength={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('admin.phoneCode')}</Label>
                        <Input
                          value={formData.phone_code}
                          onChange={(e) => setFormData({ ...formData, phone_code: e.target.value })}
                          placeholder="+1"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        {t('common.cancel')}
                      </Button>
                      <Button onClick={handleAddCountry}>
                        {t('common.save')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('admin.searchCountryCodes')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.countryName')}</TableHead>
                      <TableHead>{t('admin.countryCode')}</TableHead>
                      <TableHead>{t('admin.phoneCode')}</TableHead>
                      <TableHead className="text-right">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          {t('common.loading')}
                        </TableCell>
                      </TableRow>
                    ) : filteredCountryCodes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {t('admin.noCountryCodes')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCountryCodes.map((country) => (
                        <TableRow key={country.id}>
                          <TableCell className="font-medium">{country.country_name}</TableCell>
                          <TableCell>{country.country_code}</TableCell>
                          <TableCell>{country.phone_code}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(country)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCountry(country.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quick-links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.otherDropdownLists')}</CardTitle>
              <CardDescription>{t('admin.otherDropdownListsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">{t('admin.categories')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{t('admin.categoriesDescription')}</p>
                    <p className="text-xs text-muted-foreground">{t('admin.navigateTo')}: Tools Directory → Categories</p>
                  </CardContent>
                </Card>
                <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">{t('admin.subCategories')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{t('admin.subCategoriesDescription')}</p>
                    <p className="text-xs text-muted-foreground">{t('admin.navigateTo')}: Tools Directory → Sub-Categories</p>
                  </CardContent>
                </Card>
                <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">{t('admin.interests')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{t('admin.interestsDescription')}</p>
                    <p className="text-xs text-muted-foreground">{t('admin.navigateTo')}: Content Management → Interests</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.editCountryCode')}</DialogTitle>
            <DialogDescription>{t('admin.editCountryCodeDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('admin.countryName')}</Label>
              <Input
                value={formData.country_name}
                onChange={(e) => setFormData({ ...formData, country_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.countryCode')}</Label>
              <Input
                value={formData.country_code}
                onChange={(e) => setFormData({ ...formData, country_code: e.target.value.toUpperCase() })}
                maxLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.phoneCode')}</Label>
              <Input
                value={formData.phone_code}
                onChange={(e) => setFormData({ ...formData, phone_code: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleEditCountry}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DropdownListsManagement;