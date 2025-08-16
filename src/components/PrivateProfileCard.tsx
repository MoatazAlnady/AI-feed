import React from 'react';
import { User, Lock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PrivateProfileCardProps {
  name?: string;
  profilePhoto?: string;
}

const PrivateProfileCard: React.FC<PrivateProfileCardProps> = ({ 
  name = "User", 
  profilePhoto 
}) => {
  const navigate = useNavigate();

  return (
    <div className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-8"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
        
        <div className="text-center py-20">
          <div className="relative mx-auto mb-6">
            {profilePhoto ? (
              <div className="w-24 h-24 mx-auto relative">
                <img
                  src={profilePhoto}
                  alt={name}
                  className="w-full h-full rounded-full object-cover filter blur-sm"
                />
                <div className="absolute inset-0 bg-gray-900/30 rounded-full flex items-center justify-center">
                  <Lock className="h-8 w-8 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto relative">
                <User className="h-12 w-12 text-white/70" />
                <div className="absolute inset-0 bg-gray-900/30 rounded-full flex items-center justify-center">
                  <Lock className="h-8 w-8 text-white" />
                </div>
              </div>
            )}
          </div>
          
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Private Profile
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            This user has chosen to keep their profile private. You may need to connect with them to view their full profile.
          </p>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/community')}
              style={{
                backgroundColor: '#0f172a',
                borderColor: '#334155', 
                color: '#e2e8f0'
              }}
              className="px-6 py-3 border rounded-xl font-medium transition-colors hover:bg-opacity-80"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1e293b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0f172a';
              }}
            >
              Browse Community
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivateProfileCard;