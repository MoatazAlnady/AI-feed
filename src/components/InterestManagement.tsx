import React, { useState, useEffect } from 'react';
import { Plus, X, Edit, Save, Settings } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';

interface Interest {
  id: string;
  name: string;
  category: string;
  color: string;
  created_by: string;
}

interface InterestManagementProps {
  mode: 'admin' | 'user';
  userInterests?: string[];
  onUserInterestsChange?: (interests: string[]) => void;
}

const InterestManagement: React.FC<InterestManagementProps> = ({ 
  mode, 
  userInterests = [], 
  onUserInterestsChange 
}) => {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(userInterests);
  const [newInterest, setNewInterest] = useState({ name: '', category: '', color: '#3B82F6' });
  const [editingInterest, setEditingInterest] = useState<Interest | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const categories = [
    'AI & Machine Learning',
    'Software Development',
    'Data Science',
    'Cybersecurity',
    'Cloud Computing',
    'DevOps',
    'Mobile Development',
    'Web Development',
    'Blockchain',
    'IoT',
    'AR/VR',
    'Robotics',
    'Business Intelligence',
    'Digital Marketing',
    'Other'
  ];

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  useEffect(() => {
    fetchInterests();
  }, []);

  const fetchInterests = async () => {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('content_key', 'interests')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setInterests((data.content_value as any[]).map(item => item as Interest));
      } else {
        // Initialize with default interests
        const defaultInterests = [
          { id: '1', name: 'Machine Learning', category: 'AI & Machine Learning', color: '#3B82F6', created_by: 'system' },
          { id: '2', name: 'Natural Language Processing', category: 'AI & Machine Learning', color: '#10B981', created_by: 'system' },
          { id: '3', name: 'Computer Vision', category: 'AI & Machine Learning', color: '#F59E0B', created_by: 'system' },
          { id: '4', name: 'Deep Learning', category: 'AI & Machine Learning', color: '#8B5CF6', created_by: 'system' },
          { id: '5', name: 'Data Analytics', category: 'Data Science', color: '#EF4444', created_by: 'system' },
          { id: '6', name: 'Cloud Computing', category: 'Cloud Computing', color: '#06B6D4', created_by: 'system' },
          { id: '7', name: 'React Development', category: 'Web Development', color: '#EC4899', created_by: 'system' },
          { id: '8', name: 'Python Programming', category: 'Software Development', color: '#84CC16', created_by: 'system' }
        ];
        
        await supabase
          .from('site_content')
          .insert({
            content_key: 'interests',
            content_type: 'json',
            content_value: defaultInterests as any,
            description: 'Global interests list for content tagging'
          });
        
        setInterests(defaultInterests);
      }
    } catch (error) {
      console.error('Error fetching interests:', error);
      toast({
        title: "Error",
        description: "Failed to load interests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveInterests = async (updatedInterests: Interest[]) => {
    try {
      const { error } = await supabase
        .from('site_content')
        .upsert({
          content_key: 'interests',
          content_type: 'json',
          content_value: updatedInterests as any,
          description: 'Global interests list for content tagging'
        });

      if (error) throw error;

      setInterests(updatedInterests);
      toast({
        title: "Success",
        description: "Interests updated successfully"
      });
    } catch (error) {
      console.error('Error saving interests:', error);
      toast({
        title: "Error",
        description: "Failed to save interests",
        variant: "destructive"
      });
    }
  };

  const handleAddInterest = async () => {
    if (!newInterest.name.trim() || !newInterest.category) return;

    const interest: Interest = {
      id: Date.now().toString(),
      name: newInterest.name.trim(),
      category: newInterest.category,
      color: newInterest.color,
      created_by: user?.id || 'anonymous'
    };

    const updatedInterests = [...interests, interest];
    await saveInterests(updatedInterests);
    
    setNewInterest({ name: '', category: '', color: '#3B82F6' });
    setShowAddForm(false);
  };

  const handleEditInterest = async () => {
    if (!editingInterest) return;

    const updatedInterests = interests.map(interest =>
      interest.id === editingInterest.id ? editingInterest : interest
    );

    await saveInterests(updatedInterests);
    setEditingInterest(null);
  };

  const handleDeleteInterest = async (id: string) => {
    const updatedInterests = interests.filter(interest => interest.id !== id);
    await saveInterests(updatedInterests);
  };

  const toggleUserInterest = (interestName: string) => {
    const updated = selectedInterests.includes(interestName)
      ? selectedInterests.filter(i => i !== interestName)
      : [...selectedInterests, interestName];
    
    setSelectedInterests(updated);
    onUserInterestsChange?.(updated);
  };

  const saveUserInterests = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { interests: selectedInterests }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your interests have been updated"
      });
    } catch (error) {
      console.error('Error saving user interests:', error);
      toast({
        title: "Error",
        description: "Failed to save your interests",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading interests...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {mode === 'admin' ? 'Interest Management' : 'Your Interests'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {mode === 'admin' ? (
          <div className="space-y-6">
            {/* Add New Interest */}
            <div>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="mb-4"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Interest
              </Button>

              {showAddForm && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                  <Input
                    placeholder="Interest name"
                    value={newInterest.name}
                    onChange={(e) => setNewInterest({ ...newInterest, name: e.target.value })}
                  />
                  <select
                    value={newInterest.category}
                    onChange={(e) => setNewInterest({ ...newInterest, category: e.target.value })}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    {colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewInterest({ ...newInterest, color })}
                        className={`w-8 h-8 rounded-full border-2 ${
                          newInterest.color === color ? 'border-gray-900' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddInterest} size="sm">
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => setShowAddForm(false)} variant="outline" size="sm">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Interests List */}
            <div className="space-y-4">
              {categories.map(category => {
                const categoryInterests = interests.filter(i => i.category === category);
                if (categoryInterests.length === 0) return null;

                return (
                  <div key={category}>
                    <h4 className="font-medium mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {categoryInterests.map(interest => (
                        <div key={interest.id} className="flex items-center gap-2">
                          {editingInterest?.id === interest.id ? (
                            <div className="flex items-center gap-2 p-2 border rounded">
                              <Input
                                value={editingInterest.name}
                                onChange={(e) => setEditingInterest({ ...editingInterest, name: e.target.value })}
                                className="w-32"
                              />
                              <Button onClick={handleEditInterest} size="sm">
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button onClick={() => setEditingInterest(null)} variant="outline" size="sm">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Badge
                              style={{ backgroundColor: interest.color }}
                              className="text-white flex items-center gap-2"
                            >
                              {interest.name}
                              <button
                                onClick={() => setEditingInterest(interest)}
                                className="ml-1"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteInterest(interest.id)}
                                className="ml-1"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Interest Selection */}
            <div className="space-y-4">
              {categories.map(category => {
                const categoryInterests = interests.filter(i => i.category === category);
                if (categoryInterests.length === 0) return null;

                return (
                  <div key={category}>
                    <h4 className="font-medium mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {categoryInterests.map(interest => (
                        <Badge
                          key={interest.id}
                          onClick={() => toggleUserInterest(interest.name)}
                          className={`cursor-pointer transition-all ${
                            selectedInterests.includes(interest.name)
                              ? 'bg-primary text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {interest.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <Button onClick={saveUserInterests} className="w-full">
              Save My Interests
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InterestManagement;