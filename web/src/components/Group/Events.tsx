import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Event {
  id: number;
  title: string;
  description: string;
  date_time: string;
  creator: {
    username: string;
  };
  responses?: {
    id: number;
    response: string;
    user_id: number;
  }[];
}

interface EventsProps {
  groupId?: string;
}
//set event state if past it should not show respond buttons
const Events: React.FC<EventsProps> = ({ groupId }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date_time: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    if (groupId) {
      fetchEvents();
    } else {
      setLoading(false);
      setEvents([]);
    }
  }, [groupId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/groups/${groupId}/events`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched events 1:', data);
      // Ensure we have an array even if the backend returns null
      setEvents(Array.isArray(data) ? data : []);
      console.log('Fetched events 2:', events);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Format the date_time to ISO string for backend compatibility
      const formattedEvent = {
        ...newEvent,
        date_time: new Date(newEvent.date_time).toISOString(), // Ensure proper ISO format
        group_id: Number(groupId),
        creator_id: user?.id
      };
      
      console.log('Submitting event:', formattedEvent);
      
      const response = await fetch(`/api/groups/${groupId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formattedEvent),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      // Reset form and close modal
      setNewEvent({
        title: '',
        description: '',
        date_time: '',
      });
      setShowCreateModal(false);
      
      // Refresh events list
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      setError('Failed to create event. Please try again.');
    }
  };

  const handleResponseToEvent = async (eventId: number, response: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/events/${eventId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          response,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      // Update local state to reflect the change
      fetchEvents();
    } catch (error) {
      console.error('Error responding to event:', error);
      setError('Failed to update your response. Please try again.');
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-md p-4 text-red-200">
        <p>{error}</p>
      </div>
    );
  }
  console.log('Events:', events);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Upcoming Events</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create Event
        </button>
      </div>

      {!events || events.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">No Events Yet</h3>
          <p className="text-gray-400 mb-6">Be the first to create an event for this group!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filter out past events */}
          {events && events
            .filter(event => new Date(event.date_time) > new Date()) // Only show future events
            .map((event) => (
            <div key={event.id} className="bg-gradient-to-br from-gray-800/80 to-gray-900/90 rounded-xl border border-gray-700/50 shadow-lg overflow-hidden transform transition-all hover:scale-[1.01] hover:shadow-xl">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white">{event.title}</h3>
                  <div className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                    {new Date(event.date_time) > new Date() ? 'Upcoming' : 'Past'}
                  </div>
                </div>
                
                <p className="text-gray-300 mb-5 line-clamp-2">{event.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-800/70 backdrop-blur-sm px-4 py-3 rounded-lg flex items-center gap-3 border border-gray-700/50">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 font-medium">Date & Time</div>
                      <div className="text-gray-200">{formatDateTime(event.date_time)}</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/70 backdrop-blur-sm px-4 py-3 rounded-lg flex items-center gap-3 border border-gray-700/50">
                    <div className="bg-green-500/20 p-2 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 font-medium">Organizer</div>
                      <div className="text-gray-200">{event.creator?.username || 'Unknown'}</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/70 backdrop-blur-sm px-4 py-3 rounded-lg flex items-center gap-3 border border-gray-700/50">
                    <div className="bg-purple-500/20 p-2 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 font-medium">Attendance</div>
                      <div className="text-gray-200">{event.responses?.filter(r => r.response === 'going').length || 0} attending</div>
                    </div>
                  </div>
                </div>
                
                {/* Only show response buttons for upcoming events */}
                {new Date(event.date_time) > new Date() ? (
                  <div className="flex gap-4 mt-6 relative">
                    {user?.id && event.responses && event.responses.some(r => r.user_id === Number(user.id)) && (
                      <div className="absolute -top-5 left-0 right-0 text-center">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                          Your response: {user?.id && event.responses.find(r => r.user_id === Number(user.id))?.response === 'going' ? 'Going' : 'Not Going'}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => handleResponseToEvent(event.id, 'going')}
                      className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        user?.id && event.responses && event.responses.some(r => r.user_id === Number(user.id) && r.response === 'going')
                          ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md shadow-green-600/20 ring-2 ring-green-400 ring-offset-2 ring-offset-gray-900'
                          : event.responses && event.responses.some(r => r.response === 'going')
                            ? 'bg-gradient-to-r from-green-600/80 to-green-500/80 text-white shadow-md shadow-green-600/10'
                            : 'bg-gray-800 hover:bg-gradient-to-r hover:from-green-600/80 hover:to-green-500/80 text-gray-300 hover:text-white border border-gray-700 hover:border-green-500/30'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Going
                    </button>
                    
                    <button
                      onClick={() => handleResponseToEvent(event.id, 'not_going')}
                      className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        user?.id && event.responses && event.responses.some(r => r.user_id === Number(user.id) && r.response === 'not_going')
                          ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-600/20 ring-2 ring-red-400 ring-offset-2 ring-offset-gray-900'
                          : event.responses && event.responses.some(r => r.response === 'not_going')
                            ? 'bg-gradient-to-r from-red-600/80 to-red-500/80 text-white shadow-md shadow-red-600/10'
                            : 'bg-gray-800 hover:bg-gradient-to-r hover:from-red-600/80 hover:to-red-500/80 text-gray-300 hover:text-white border border-gray-700 hover:border-red-500/30'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Not Going
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 bg-gray-800/50 rounded-lg border border-gray-700/30 p-3 text-center">
                    <p className="text-gray-400 text-sm">This event has already passed</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-700/50 animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 h-8 w-1 rounded-full"></div>
                <h3 className="text-xl font-bold text-white">Create New Event</h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700/50 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="space-y-5">
              <div className="relative">
                <label htmlFor="eventTitle" className="block text-sm font-medium text-blue-400 mb-1.5">
                  Event Title
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="eventTitle"
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pl-10 pr-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Enter a catchy title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="relative">
                <label htmlFor="eventDescription" className="block text-sm font-medium text-blue-400 mb-1.5">
                  Description
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </div>
                  <textarea
                    id="eventDescription"
                    rows={4}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pl-10 pr-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Describe what this event is about"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="relative">
                <label htmlFor="eventDateTime" className="block text-sm font-medium text-blue-400 mb-1.5">
                  Date and Time
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="datetime-local"
                    id="eventDateTime"
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pl-10 pr-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={newEvent.date_time}
                    onChange={(e) => setNewEvent({...newEvent, date_time: e.target.value})}
                    required
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-400">Select a date and time for your event</p>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-all duration-200 text-sm font-medium border border-gray-700 hover:border-gray-600 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-lg shadow-blue-900/30 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
