import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Calendar,
  MapPin,
  Clock,
  User
} from 'lucide-react';
import CreateGroupModal from '../components/CreateGroupModal';
import CreateEventModal from '../components/CreateEventModal';
import { useAuth } from '../context/AuthContext';

const Community: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'groups' | 'events'>('groups');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleGroupCreated = (newGroup: any) => {
    setGroups([newGroup, ...groups]);
  };

  const handleEventCreated = (newEvent: any) => {
    setEvents([newEvent, ...events]);
  };

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="py-8 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              AI Community
            </h1>
            <p className="text-xl text-gray-600">
              Connect, share, and learn with AI enthusiasts worldwide
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-2xl shadow-sm mb-8">
            <div className="flex border-b border-gray-200">
              {[
                { key: 'groups', label: 'Groups', icon: Users },
                { key: 'events', label: 'Events', icon: Calendar }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === key
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div>
            {activeTab === 'groups' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">AI Groups</h2>
                  <button 
                    onClick={() => setShowCreateGroup(true)}
                    className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Group</span>
                  </button>
                </div>
                
                {filteredGroups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredGroups.map((group) => (
                      <div key={group.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                        <img
                          src={group.image}
                          alt={group.name}
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">{group.name}</h3>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              {group.privacy}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{group.description}</p>
                          <p className="text-xs text-gray-500 mb-4">Created by {group.creator}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{group.members.toLocaleString()} members</span>
                            <button className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-600 transition-colors">
                              Join
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No Groups Yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Be the first to create a group! Groups will appear here once they are created.
                    </p>
                    <button
                      onClick={() => setShowCreateGroup(true)}
                      className="bg-primary-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors"
                    >
                      Create First Group
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'events' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">AI Events</h2>
                  <button 
                    onClick={() => setShowCreateEvent(true)}
                    className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Event</span>
                  </button>
                </div>
                
                {filteredEvents.length > 0 ? (
                  <div className="space-y-4">
                    {filteredEvents.map((event) => (
                      <div key={event.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-gray-900 text-lg">{event.title}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                event.type === 'online' ? 'bg-green-100 text-green-700' :
                                event.type === 'in-person' ? 'bg-blue-100 text-blue-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {event.type}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3">{event.description}</p>
                            
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(event.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{event.time}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>{event.location}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-500">
                                <span>Organized by {event.organizer}</span>
                                <span className="mx-2">•</span>
                                <span>{event.attendees} attending</span>
                              </div>
                              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                                {event.category}
                              </span>
                            </div>
                          </div>
                          
                          <button className="ml-4 bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors">
                            Attend
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No Events Yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Be the first to create an event! Events will appear here once they are created.
                    </p>
                    <button
                      onClick={() => setShowCreateEvent(true)}
                      className="bg-primary-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors"
                    >
                      Create First Event
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={handleGroupCreated}
      />
      
      <CreateEventModal
        isOpen={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        onEventCreated={handleEventCreated}
      />
    </>
  );
};

export default Community;