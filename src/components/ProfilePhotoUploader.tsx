import React, { useState, useEffect } from 'react';
import { Camera, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

interface ProfilePhotoUploaderProps {
  type: 'profile' | 'cover';
  currentPhoto?: string;
  onUploadComplete?: (url: string) => void;
  className?: string;
}

const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  type,
  currentPhoto,
  onUploadComplete,
  className = ''
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    try {
      setIsUploading(true);
      
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${type}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${type}-photos/${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);
      
      if (!data.publicUrl) throw new Error('Failed to get public URL');
      
      // Update user profile in user_profiles table
      const updateField = type === 'profile' ? 'profile_photo' : 'cover_photo';
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          [updateField]: data.publicUrl
        });
      
      if (updateError) throw updateError;
      
      toast.success(`${type === 'profile' ? 'Profile' : 'Cover'} photo updated successfully!`);
      
      if (onUploadComplete) {
        onUploadComplete(data.publicUrl);
      }
      
      // Update local state
      await fetchUserProfile();
      
    } catch (error) {
      console.error(`Error uploading ${type} photo:`, error);
      toast.error(`Failed to upload ${type} photo. Please try again.`);
    } finally {
      setIsUploading(false);
    }
  };

  const getDisplayPhoto = () => {
    if (type === 'profile') {
      return userProfile?.profile_photo || currentPhoto;
    } else {
      return userProfile?.cover_photo || currentPhoto;
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        id={`${type}-photo-input`}
        onChange={handlePhotoChange}
        accept="image/*"
        className="hidden"
        disabled={isUploading}
      />
      
      {type === 'cover' ? (
        <div className="h-64 bg-gradient-to-r from-primary-500 to-secondary-500 relative rounded-t-2xl overflow-hidden">
          {getDisplayPhoto() && (
            <img 
              src={getDisplayPhoto()} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          )}
          <label
            htmlFor="cover-photo-input"
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors cursor-pointer"
          >
            {isUploading ? (
              <Upload className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </label>
        </div>
      ) : (
        <div className="relative">
          <div className="w-32 h-32 bg-white dark:bg-gray-700 rounded-full p-2 shadow-lg">
            {getDisplayPhoto() ? (
              <img
                src={getDisplayPhoto()}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
          <label
            htmlFor="profile-photo-input"
            className="absolute bottom-2 right-2 p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors cursor-pointer"
          >
            {isUploading ? (
              <Upload className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </label>
        </div>
      )}
    </div>
  );
};

export default ProfilePhotoUploader;