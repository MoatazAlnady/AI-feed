import React, { useState } from 'react';
import { 
  User, 
  UserPlus, 
  UserCheck, 
  MessageCircle, 
  MapPin, 
  Briefcase, 
  ExternalLink,
  Github,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  Globe,
  Mail,
  Phone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileCardProps {
  userId: string;
  name: string;
  title?: string;
  company?: string;
  location?: string;
  bio?: string;
  profilePhoto?: string;
  isFollowing?: boolean;
  showContactInfo?: boolean;
  socialLinks?: {
    website?: string;
    github?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  onFollow?: () => void;
  onMessage?: () => void;
  className?: string;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  userId,
  name,
  title,
  company,
  location,
  bio,
  profilePhoto,
  isFollowing = false,
  showContactInfo = false,
  socialLinks = {},
  contactInfo = {},
  onFollow,
  onMessage,
  className = ''
}) => {
  const { user } = useAuth();
  const [following, setFollowing] = useState(isFollowing);
  const [loading, setLoading] = useState(false);

  const isOwnProfile = user?.id === userId;

  const handleFollow = async () => {
    if (!onFollow) return;
    setLoading(true);
    try {
      await onFollow();
      setFollowing(!following);
    } catch (error) {
      console.error('Error following user:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'github': return Github;
      case 'linkedin': return Linkedin;
      case 'twitter': return Twitter;
      case 'instagram': return Instagram;
      case 'youtube': return Youtube;
      case 'website': return Globe;
      default: return ExternalLink;
    }
  };

  const getSocialUrl = (platform: string, value: string) => {
    if (value.startsWith('http')) return value;
    
    switch (platform) {
      case 'github': return `https://github.com/${value}`;
      case 'linkedin': return `https://linkedin.com/in/${value}`;
      case 'twitter': return `https://twitter.com/${value}`;
      case 'instagram': return `https://instagram.com/${value}`;
      case 'youtube': return `https://youtube.com/@${value}`;
      default: return value;
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-start space-x-4">
        {/* Profile Photo */}
        <div className="flex-shrink-0">
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt={name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{name}</h3>
          
          {title && (
            <div className="flex items-center text-gray-600 mt-1">
              <Briefcase className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="text-sm truncate">
                {title}{company && ` at ${company}`}
              </span>
            </div>
          )}
          
          {location && (
            <div className="flex items-center text-gray-600 mt-1">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="text-sm truncate">{location}</span>
            </div>
          )}
          
          {bio && (
            <p className="text-gray-600 text-sm mt-2 line-clamp-2">{bio}</p>
          )}

          {/* Social Links */}
          {Object.keys(socialLinks).length > 0 && (
            <div className="flex items-center space-x-2 mt-3">
              {Object.entries(socialLinks).map(([platform, value]) => {
                if (!value) return null;
                const Icon = getSocialIcon(platform);
                return (
                  <a
                    key={platform}
                    href={getSocialUrl(platform, value)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title={`${platform}: ${value}`}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          )}

          {/* Contact Info (only if user chose to show it) */}
          {showContactInfo && (contactInfo.email || contactInfo.phone) && (
            <div className="mt-3 space-y-1">
              {contactInfo.email && (
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {contactInfo.email}
                  </a>
                </div>
              )}
              {contactInfo.phone && (
                <div className="flex items-center text-gray-600">
                  <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {contactInfo.phone}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!isOwnProfile && (
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleFollow}
              disabled={loading}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                following
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              } disabled:opacity-50`}
            >
              {following ? (
                <>
                  <UserCheck className="h-4 w-4" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Follow</span>
                </>
              )}
            </button>
            
            <button
              onClick={onMessage}
              className="flex items-center space-x-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Message</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileCard;