import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Calendar from 'react-calendar';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays, Image as ImageIcon, Video, FileText, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SlidePanel } from '../components/ui/SlidePanel';
import { ScheduleModal } from '../components/calendar/ScheduleModal';
import { MOCK_EVENTS, MOCK_CHANNELS } from '../constants/dummyData';
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter, FaYoutube, FaWhatsapp, FaDiscord } from 'react-icons/fa';
import { FaThreads } from 'react-icons/fa6';

import 'react-calendar/dist/Calendar.css';
import '../styles/calendar-custom.css'; // We'll create this to override styles

const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const formattedHours = h % 12 || 12;
  return `${formattedHours}:${minutes} ${ampm}`;
};

const getChannelIcon = (id) => {
  const channel = MOCK_CHANNELS.find(c => c.id === id);
  if (!channel) return null;
  switch (channel.platform.toLowerCase()) {
    case 'facebook': return <FaFacebook className="w-2.5 h-2.5 text-[#1877F2]" />;
    case 'instagram': return <FaInstagram className="w-2.5 h-2.5 text-[#E1306C]" />;
    case 'linkedin': return <FaLinkedin className="w-2.5 h-2.5 text-[#0A66C2]" />;
    case 'x': return <FaTwitter className="w-2.5 h-2.5 text-black" />;
    case 'threads': return <FaThreads className="w-2.5 h-2.5 text-black" />;
    case 'youtube': return <FaYoutube className="w-2.5 h-2.5 text-[#FF0000]" />;
    case 'whatsapp': return <FaWhatsapp className="w-2.5 h-2.5 text-[#25D366]" />;
    case 'discord': return <FaDiscord className="w-2.5 h-2.5 text-[#5865F2]" />;
    default: return null;
  }
};

export default function CalendarPage() {
  const { t } = useTranslation();
  const [viewDate, setViewDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDayPanelOpen, setIsDayPanelOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedEventIdx, setExpandedEventIdx] = useState(null);
  
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/events', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          
          // Realistic demo: Make the most recently scheduled event "partially posted"
          // so the user sees their own content failing/posting on different platforms.
          if (data.length > 0) {
            const latestEvent = data[data.length - 1];
            if (latestEvent.channels && latestEvent.channels.length > 1) {
              latestEvent.status = 'partial';
              latestEvent.channel_statuses = {};
              latestEvent.channels.forEach((ch, idx) => {
                latestEvent.channel_statuses[ch] = idx === 0 ? 'posted' : 'failed';
              });
            } else if (latestEvent.channels && latestEvent.channels.length === 1) {
              latestEvent.status = 'failed';
              latestEvent.channel_statuses = { [latestEvent.channels[0]]: 'failed' };
            }
          }
          
          setEvents(data);
        }
      } catch (err) {
        console.error('Failed to fetch calendar events', err);
      }
    };
    fetchEvents();
  }, []);

  const selectedDayEvents = events.filter(e => {
    if (!selectedDate) return false;
    const eDate = new Date(e.date || e.timestamp || e.created_at || new Date());
    return eDate.getDate() === selectedDate.getDate() && 
           eDate.getMonth() === selectedDate.getMonth() && 
           eDate.getFullYear() === selectedDate.getFullYear();
  }).sort((a, b) => {
    const timeA = a.time || '00:00';
    const timeB = b.time || '00:00';
    return timeA.localeCompare(timeB);
  });

  const handleDateClick = (value) => {
    setSelectedDate(value);
    setIsDayPanelOpen(true);
  };

  const handleScheduleEvent = (savedEvent) => {
    setEvents(prev => [...prev, savedEvent]);
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== eventId));
      }
    } catch (err) {
      console.error('Failed to delete event', err);
    }
  };

  const setToday = () => {
    const today = new Date();
    setViewDate(today);
    setSelectedDate(today);
    setIsDayPanelOpen(true);
  };

  const tileDisabled = ({ date, view }) => {
    return false;
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayEvents = events.filter(e => {
        const eDate = new Date(e.date || e.timestamp || e.createdAt || new Date());
        return eDate.getDate() === date.getDate() && 
               eDate.getMonth() === date.getMonth() && 
               eDate.getFullYear() === date.getFullYear();
      });

      if (dayEvents.length > 0) {
        return (
          <div className="calendar-events-container flex flex-col gap-1 mt-1 w-full flex-1 text-left">
            {dayEvents.sort((a,b) => (a.time || '').localeCompare(b.time || '')).map((event, i) => (
              <div key={i} className="flex flex-col gap-0 text-[9px] leading-tight bg-primary/10 text-primary px-1 py-0.5 rounded border border-primary/20 transition-all hover:bg-primary/20" title={event.caption || event.title || 'Scheduled Post'}>
                <div className="flex items-center gap-1 font-semibold">
                  {event.type === 'image' ? <ImageIcon className="w-2.5 h-2.5" /> : event.type === 'video' ? <Video className="w-2.5 h-2.5" /> : <FileText className="w-2.5 h-2.5" />}
                  <span>{formatTime12h(event.time)}</span>
                </div>
                {event.channels && event.channels.length > 0 && (
                  <div className="flex items-center gap-0.5 flex-wrap mt-0.5">
                    {event.channels.map(chId => (
                      <span key={chId} title={MOCK_CHANNELS.find(c => c.id === chId)?.platform}>
                        {getChannelIcon(chId)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary" />
            {t('calendar.title', 'Calendar')}
          </h2>
          <p className="text-muted-foreground">{t('calendar.desc', 'Manage your upcoming social media posts.')}</p>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 bg-card p-2 rounded-xl border border-border shadow-sm w-full sm:w-auto mt-4 sm:mt-0">
          <Button variant="ghost" size="icon" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-2 px-2">
            <select 
              value={viewDate.getMonth()} 
              onChange={(e) => setViewDate(new Date(viewDate.getFullYear(), parseInt(e.target.value), 1))}
              className="font-semibold text-foreground bg-transparent focus:outline-none cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>{format(new Date(2024, i, 1), 'MMMM')}</option>
              ))}
            </select>
            <select 
              value={viewDate.getFullYear()} 
              onChange={(e) => setViewDate(new Date(parseInt(e.target.value), viewDate.getMonth(), 1))}
              className="font-semibold text-foreground bg-transparent focus:outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <Button variant="ghost" size="icon" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>
            <ChevronRight className="w-5 h-5" />
          </Button>
          
          <div className="w-px h-6 bg-[#E2E8F0] mx-1"></div>
          <Button variant="secondary" size="sm" onClick={setToday}>{t('calendar.today', 'Today')}</Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm flex-1 overflow-hidden p-4">
        <Calendar
          activeStartDate={viewDate}
          onActiveStartDateChange={({ activeStartDate }) => setViewDate(activeStartDate)}
          value={selectedDate}
          onClickDay={handleDateClick}
          tileDisabled={tileDisabled}
          tileContent={tileContent}
          nextLabel={null}
          prevLabel={null}
          next2Label={null}
          prev2Label={null}
          showNavigation={false} // We built our own custom navigation above
          className="w-full h-full border-none font-sans"
        />
      </div>

      <SlidePanel
        isOpen={isDayPanelOpen}
        onClose={() => setIsDayPanelOpen(false)}
        title={`Posts for ${selectedDate ? format(selectedDate, 'MMM d, yyyy') : ''}`}
      >
        <div className="space-y-6">
          {selectedDayEvents.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-border">
              <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No posts scheduled for this day.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDayEvents.map((event, idx) => (
                <div 
                  key={idx} 
                  className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col gap-3 cursor-pointer transition-all hover:border-primary/50"
                  onClick={() => setExpandedEventIdx(expandedEventIdx === idx ? null : idx)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        {event.type === 'image' ? <ImageIcon className="w-4 h-4" /> : event.type === 'video' ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">{formatTime12h(event.time)}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground capitalize">{event.type} Post</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            event.status === 'posted' ? 'bg-green-100 text-green-700' : 
                            event.status === 'failed' ? 'bg-red-100 text-red-700' : 
                            event.status === 'partial' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'}`}>
                            {event.status === 'partial' ? 'partially posted' : (event.status || 'scheduled')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.status !== 'posted' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedEventIdx === idx ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                  
                  {expandedEventIdx === idx && (
                    <div className="animate-in slide-in-from-top-2 fade-in duration-200 flex flex-col gap-3">
                  {event.media_path && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                      {event.type === 'video' ? (
                        <video src={`/uploads/${event.media_path}`} controls className="w-full h-auto max-h-48 object-cover" />
                      ) : (
                        <img src={`/uploads/${event.media_path}`} alt="Scheduled media" className="w-full h-auto max-h-48 object-cover" />
                      )}
                    </div>
                  )}

                  {event.caption && (
                    <p className="text-sm text-foreground bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">{event.caption}</p>
                  )}
                  {event.title && (
                    <p className="text-sm text-foreground bg-gray-50 p-3 rounded-lg border border-gray-100">{event.title}</p>
                  )}
                  {event.channels && event.channels.length > 0 && (
                    <div className="flex flex-col gap-2 pt-3 border-t border-border mt-2">
                      <span className="text-xs text-muted-foreground">Platform Status:</span>
                      <div className="flex flex-col gap-2">
                        {event.channels.map(chId => {
                          const status = event.channel_statuses ? event.channel_statuses[chId] : event.status;
                          return (
                            <div key={chId} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                              <div className="flex items-center gap-2">
                                <span title={MOCK_CHANNELS.find(c => c.id === chId)?.platform}>
                                  {getChannelIcon(chId)}
                                </span>
                                <span className="text-xs font-medium text-foreground">{MOCK_CHANNELS.find(c => c.id === chId)?.platform}</span>
                              </div>
                              {status === 'posted' && <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">Posted</span>}
                              {status === 'failed' && <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">Failed</span>}
                              {(status === 'scheduled' || !status) && <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">Scheduled</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {event.platform && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border mt-1">
                      <span className="text-xs text-muted-foreground">Posted to: {event.platform}</span>
                    </div>
                  )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {(!selectedDate || (new Date(selectedDate).setHours(0,0,0,0) >= new Date().setHours(0,0,0,0))) && (
            <Button 
              className="w-full flex items-center justify-center gap-2 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all mt-4"
              onClick={() => {
                setIsDayPanelOpen(false);
                setTimeout(() => setIsModalOpen(true), 200);
              }}
            >
              <Plus className="w-5 h-5" /> Schedule New Post
            </Button>
          )}
        </div>
      </SlidePanel>

      <ScheduleModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        selectedDate={selectedDate || new Date()} 
        onSchedule={handleScheduleEvent}
      />
    </div>
  );
}
