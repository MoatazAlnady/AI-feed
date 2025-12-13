import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Check, 
  X, 
  AlertTriangle, 
  Clock, 
  Filter, 
  Search,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface EditRequest {
  id: string;
  tool_id: string;
  tool_name: string;
  user_id: string;
  user_name: string;
  name: string | null;
  description: string | null;
  category_id: string | null;
  category_name: string | null;
  subcategory: string | null;
  website: string | null;
  pricing: string | null;
  features: string[] | null;
  pros: string[] | null;
  cons: string[] | null;
  tags: string[] | null;
  created_at: string;
}

const AdminToolRequests: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editRequests, setEditRequests] = useState<EditRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<EditRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending'>('pending');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    fetchEditRequests();
  }, [isAdmin, statusFilter]);

  const fetchEditRequests = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_pending_edit_requests', {
        limit_param: 100,
        offset_param: 0
      });

      if (error) throw error;
      
      setEditRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching edit requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request: EditRequest) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setActionSuccess('');
    setActionError('');
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      setProcessingAction(true);
      setActionError('');
      
      const { error } = await supabase.rpc('approve_tool_edit_request', {
        request_id_param: selectedRequest.id,
        admin_notes_param: adminNotes
      });

      if (error) throw error;
      
      setActionSuccess(t('adminToolRequests.messages.approved'));
      fetchEditRequests();
      
      // Close the detail view after a short delay
      setTimeout(() => {
        setSelectedRequest(null);
      }, 2000);
    } catch (error: any) {
      console.error('Error approving edit request:', error);
      setActionError(error.message || t('adminToolRequests.messages.approveError'));
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      setProcessingAction(true);
      setActionError('');
      
      if (!adminNotes.trim()) {
        setActionError(t('adminToolRequests.messages.provideReason'));
        setProcessingAction(false);
        return;
      }
      
      const { error } = await supabase.rpc('reject_tool_edit_request', {
        request_id_param: selectedRequest.id,
        admin_notes_param: adminNotes
      });

      if (error) throw error;
      
      setActionSuccess(t('adminToolRequests.messages.rejected'));
      fetchEditRequests();
      
      // Close the detail view after a short delay
      setTimeout(() => {
        setSelectedRequest(null);
      }, 2000);
    } catch (error: any) {
      console.error('Error rejecting edit request:', error);
      setActionError(error.message || t('adminToolRequests.messages.rejectError'));
    } finally {
      setProcessingAction(false);
    }
  };

  const filteredRequests = editRequests.filter(request => {
    const matchesSearch = 
      request.tool_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>{t('adminToolRequests.backToAdmin')}</span>
          </button>
          
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('adminToolRequests.title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {t('adminToolRequests.subtitle')}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder={t('adminToolRequests.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending')}
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="pending">{t('adminToolRequests.filters.pending')}</option>
                <option value="all">{t('adminToolRequests.filters.all')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Requests List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {statusFilter === 'pending' ? t('adminToolRequests.filters.pending') : t('adminToolRequests.filters.all')}
                  {filteredRequests.length > 0 && ` (${filteredRequests.length})`}
                </h2>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
                </div>
              ) : filteredRequests.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                  {filteredRequests.map((request) => (
                    <button
                      key={request.id}
                      onClick={() => handleViewRequest(request)}
                      className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedRequest?.id === request.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {request.tool_name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('adminToolRequests.list.editedBy')} {request.user_name}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(request.created_at).toLocaleString()}
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs">
                          {t('adminToolRequests.list.pending')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm 
                      ? t('adminToolRequests.empty.noMatches')
                      : t('adminToolRequests.empty.noPending')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Request Details */}
          <div className="lg:col-span-2">
            {selectedRequest ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('adminToolRequests.details.title', { name: selectedRequest.tool_name })}
                  </h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{t('adminToolRequests.details.submittedBy')} {selectedRequest.user_name}</span>
                    <span>•</span>
                    <span>{new Date(selectedRequest.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {actionSuccess && (
                  <div className="mb-6 p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 rounded-lg flex items-center">
                    <Check className="h-5 w-5 mr-2" />
                    {actionSuccess}
                  </div>
                )}

                {actionError && (
                  <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg">
                    {actionError}
                  </div>
                )}

                <div className="space-y-6">
                  {/* Name */}
                  {selectedRequest.name && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('adminToolRequests.details.fields.name')}</h3>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-gray-900 dark:text-white">{selectedRequest.name}</p>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {selectedRequest.description && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('adminToolRequests.details.fields.description')}</h3>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedRequest.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Category */}
                  {selectedRequest.category_name && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</h3>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-gray-900 dark:text-white">{selectedRequest.category_name}</p>
                      </div>
                    </div>
                  )}

                  {/* Subcategory */}
                  {selectedRequest.subcategory && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subcategory</h3>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-gray-900 dark:text-white">{selectedRequest.subcategory}</p>
                      </div>
                    </div>
                  )}

                  {/* Website */}
                  {selectedRequest.website && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</h3>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <a 
                          href={selectedRequest.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          {selectedRequest.website}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  {selectedRequest.pricing && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pricing</h3>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-gray-900 dark:text-white capitalize">{selectedRequest.pricing}</p>
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  {selectedRequest.features && selectedRequest.features.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Features</h3>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <ul className="list-disc pl-5 space-y-1">
                          {selectedRequest.features.map((feature, index) => (
                            <li key={index} className="text-gray-900 dark:text-white">{feature}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Pros */}
                  {selectedRequest.pros && selectedRequest.pros.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pros</h3>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <ul className="list-disc pl-5 space-y-1">
                          {selectedRequest.pros.map((pro, index) => (
                            <li key={index} className="text-gray-900 dark:text-white">{pro}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Cons */}
                  {selectedRequest.cons && selectedRequest.cons.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cons</h3>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <ul className="list-disc pl-5 space-y-1">
                          {selectedRequest.cons.map((con, index) => (
                            <li key={index} className="text-gray-900 dark:text-white">{con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedRequest.tags && selectedRequest.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</h3>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex flex-wrap gap-2">
                          {selectedRequest.tags.map((tag, index) => (
                            <span 
                              key={index}
                              className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin Notes */}
                  <div>
                    <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Admin Notes {!adminNotes && <span className="text-red-500 dark:text-red-400">(Required for rejection)</span>}
                    </label>
                    <textarea
                      id="adminNotes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Add notes about this edit request (will be visible to the user)"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <button
                      onClick={handleApproveRequest}
                      disabled={processingAction}
                      className="flex-1 bg-green-500 dark:bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-600 dark:hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {processingAction ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <ThumbsUp className="h-5 w-5" />
                          <span>Approve</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleRejectRequest}
                      disabled={processingAction}
                      className="flex-1 bg-red-500 dark:bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-600 dark:hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {processingAction ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <ThumbsDown className="h-5 w-5" />
                          <span>Reject</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* View Tool Button */}
                  <div className="text-center">
                    <button
                      onClick={() => navigate(`/tools/${selectedRequest.tool_id}`)}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center justify-center space-x-2 mx-auto"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Original Tool</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center">
                <MessageSquare className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Select an Edit Request
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose an edit request from the list to review its details and take action.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminToolRequests;