import React, { useState, useRef, useEffect } from 'react';
import { TimeScrollPicker } from './TimeScrollPicker';
import EmojiPicker from 'emoji-picker-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SlidePanel } from '../ui/SlidePanel';
import { Card } from '../ui/Card';
import { Image, Video, FileText, Smile, Check, UploadCloud, Clock, ChevronDown, X } from 'lucide-react';
import { MOCK_CHANNELS } from '../../constants/dummyData';
import { format } from 'date-fns';

const getCurrentTimeInTimezone = (tz) => {
  try {
    const d = new Date();
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return formatter.format(d);
  } catch(e) {
    return '10:00';
  }
};

export function ScheduleModal({ isOpen, onClose, selectedDate, onSchedule }) {
  const [step, setStep] = useState(1); // 1: Time, 2: Content, 3: Success
  const [timezone, setTimezone] = useState(() => localStorage.getItem('appTimezone') || 'Asia/Kolkata');
  const [time, setTime] = useState(() => getCurrentTimeInTimezone(localStorage.getItem('appTimezone') || 'Asia/Kolkata'));
  const [postType, setPostType] = useState('image'); // image, video, text
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [timeError, setTimeError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [channels, setChannels] = useState(MOCK_CHANNELS);

  useEffect(() => {
    if (!isOpen) return;
    const fetchAccounts = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/social/accounts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const connected = await res.json();
          const connectedPlatforms = connected.map(a => a.platform);
          setChannels(MOCK_CHANNELS.map(c => ({
            ...c,
            status: connectedPlatforms.includes(c.platform) ? 'connected' : 'disconnected'
          })));
        }
      } catch (err) {
        console.error('Failed to fetch accounts', err);
      }
    };
    fetchAccounts();
  }, [isOpen]);
  
  const timePickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (timePickerRef.current && !timePickerRef.current.contains(event.target)) {
        setShowTimePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [hStr, mStr] = (time || '10:00').split(':');
  let currentH = parseInt(hStr, 10);
  const currentM = mStr || '00';
  const currentAmPm = currentH >= 12 ? 'PM' : 'AM';
  currentH = currentH % 12 || 12;

  const handleTimeChange = (newH, newM, newAmpm) => {
    let hours24 = parseInt(newH, 10);
    if (newAmpm === 'PM' && hours24 !== 12) hours24 += 12;
    if (newAmpm === 'AM' && hours24 === 12) hours24 = 0;
    const formattedH = hours24.toString().padStart(2, '0');
    setTime(`${formattedH}:${newM}`);
    setTimeError('');
  };
  
  const fileInputRef = useRef(null);
  
  const [isChannelsPanelOpen, setIsChannelsPanelOpen] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState([]);

  const handleNext = () => {
    if (step === 1) {
      const isToday = selectedDate && new Date(selectedDate).toDateString() === new Date().toDateString();
      if (isToday) {
        const minTime = getCurrentTimeInTimezone(timezone);
        if (time < minTime) {
          setTimeError('Please select a future time for today.');
          return;
        }
      }
      setTimeError('');
    } else if (step === 2) {
      const schedulePost = async () => {
        try {
          const token = sessionStorage.getItem('token');
          
          const formData = new FormData();
          formData.append('date', selectedDate);
          formData.append('time', time);
          formData.append('timezone', timezone);
          formData.append('type', postType);
          formData.append('caption', caption);
          formData.append('channels', JSON.stringify(selectedChannels));
          
          if (selectedFile && selectedFile.file && postType !== 'text') {
            formData.append('file', selectedFile.file);
          }

          const res = await fetch('/api/events', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
          
          if (res.ok) {
            const savedEvent = await res.json();
            if (onSchedule) {
              onSchedule(savedEvent);
            }
          }
          setStep(step + 1);
        } catch (error) {
          console.error('Error scheduling post:', error);
          setStep(step + 1);
        }
      };
      schedulePost();
      return;
    }
    setStep(step + 1);
  };
  const handleBack = () => setStep(step - 1);
  const resetAndClose = () => {
    setStep(1);
    setPostType('image');
    setCaption('');
    setSelectedFile(null);
    setShowEmojiPicker(false);
    setSelectedChannels([]);
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile({
        file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const removeFile = () => {
    if (selectedFile?.preview) {
      URL.revokeObjectURL(selectedFile.preview);
    }
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePostTypeChange = (id) => {
    setPostType(id);
    removeFile();
    
    // Auto-deselect platforms that don't support text-only posts
    if (id === 'text') {
      const unsupported = ['instagram', 'youtube'];
      setSelectedChannels(prev => prev.filter(chId => {
        const channel = channels.find(c => c.id === chId);
        return channel ? !unsupported.includes(channel.platform.toLowerCase()) : false;
      }));
    }
  };

  const toggleChannel = (id) => {
    if (selectedChannels.includes(id)) {
      setSelectedChannels(selectedChannels.filter(c => c !== id));
    } else {
      setSelectedChannels([...selectedChannels, id]);
    }
  };

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={resetAndClose} 
        title={step === 1 ? 'Schedule Time' : step === 2 ? 'Create Post' : ''}
        maxWidth="max-w-2xl"
      >
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Selected Date</p>
                <h4 className="text-xl font-bold text-foreground">
                  {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}
                </h4>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                <div className="w-full sm:w-[40%]">
                  <label className="block text-sm font-medium text-foreground mb-2">Time</label>
                  <div className="relative" ref={timePickerRef}>
                    <div 
                      onClick={() => setShowTimePicker(!showTimePicker)}
                      className={`w-full h-[54px] rounded-xl border bg-background px-4 text-lg flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 accent-blue-700 ${timeError ? 'border-red-500 focus:ring-red-500' : 'border-border focus:ring-blue-700 hover:border-blue-700'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">
                          {parseInt(time.split(':')[0], 10) % 12 === 0 ? 12 : parseInt(time.split(':')[0], 10) % 12}:{time.split(':')[1]} {parseInt(time.split(':')[0], 10) >= 12 ? 'PM' : 'AM'}
                        </span>
                      </div>
                    </div>
                    {showTimePicker && (
                      <TimeScrollPicker 
                        value={time}
                        onChange={(newTime) => {
                          setTime(newTime);
                          setTimeError('');
                        }}
                        onClose={() => setShowTimePicker(false)}
                      />
                    )}
                  </div>
                </div>
                <div className="w-full sm:w-[60%]">
                  <label className="block text-sm font-medium text-foreground mb-2">Timezone</label>
                  <div className="relative">
                    <select 
                      value={timezone}
                      onChange={(e) => {
                        setTimezone(e.target.value);
                        setTime(getCurrentTimeInTimezone(e.target.value));
                        setTimeError('');
                      }}
                      className="w-full h-[54px] appearance-none cursor-pointer rounded-xl border border-border bg-background px-4 pr-10 text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="UTC">UTC (Universal Coordinated Time)</option>
                      <option value="Asia/Kolkata">IST (Indian Standard Time) - Asia/Kolkata</option>
                      <option value="America/New_York">EST (Eastern Standard Time) - America/New_York</option>
                      <option value="America/Los_Angeles">PST (Pacific Standard Time) - America/Los_Angeles</option>
                      <option value="Europe/London">GMT (Greenwich Mean Time) - Europe/London</option>
                      <option value="Europe/Paris">CET (Central European Time) - Europe/Paris</option>
                    </select>
                    <ChevronDown className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              {timeError && (
                <p className="text-red-500 text-sm text-center font-medium mt-2 animate-in fade-in slide-in-from-top-1">
                  {timeError}
                </p>
              )}

              <div className="flex justify-end pt-4 border-t border-border mt-6">
                <Button onClick={handleNext}>Continue to Content</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Post Type Selector */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Post Type</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'image', label: 'Image', icon: Image },
                    { id: 'video', label: 'Video', icon: Video },
                    { id: 'text', label: 'Text', icon: FileText },
                  ].map((type) => {
                    const Icon = type.icon;
                    const isSelected = postType === type.id;
                    return (
                      <div 
                        key={type.id}
                        onClick={() => handlePostTypeChange(type.id)}
                        className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all duration-200 ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {type.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upload Area */}
              {postType !== 'text' && (
                <div className="relative border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center bg-gray-50 overflow-hidden transition-colors">
                  {selectedFile ? (
                    <div className="relative w-full aspect-video flex items-center justify-center bg-black/5">
                      {postType === 'image' ? (
                        <img src={selectedFile.preview} alt="Preview" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <video src={selectedFile.preview} controls className="max-h-full max-w-full object-contain" />
                      )}
                      <button 
                        onClick={removeFile}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="p-8 w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 text-muted-foreground"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadCloud className="w-10 h-10 mb-2 text-gray-400" />
                      <p className="text-sm font-medium">Click to upload {postType === 'image' ? 'an image' : 'a video'}</p>
                      <p className="text-xs mt-1">
                        {postType === 'image' ? 'SVG, PNG, JPG or GIF (max. 5MB)' : 'MP4, WebM (max. 50MB)'}
                      </p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept={postType === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleFileChange}
                  />
                </div>
              )}

              {/* Description Section */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Caption & Hashtags</label>
                <div className="relative">
                  <textarea 
                    rows={4}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a captivating caption..."
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-3 text-gray-400">
                    <span className="text-xs">{caption.length}/2200</span>
                    <Smile 
                      className={`w-5 h-5 cursor-pointer hover:text-gray-600 ${showEmojiPicker ? 'text-primary' : ''}`}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                    />
                  </div>
                  {showEmojiPicker && (
                    <div className="absolute bottom-12 right-0 z-50 shadow-2xl rounded-lg overflow-hidden">
                      <EmojiPicker 
                        onEmojiClick={(emojiData) => {
                          setCaption(prev => prev + emojiData.emoji);
                        }}
                        width={300}
                        height={400}
                        theme="light"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Channels */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-foreground">Selected Channels</label>
                  <Button variant="secondary" size="sm" onClick={() => setIsChannelsPanelOpen(true)}>
                    + Add Channels
                  </Button>
                </div>
                {selectedChannels.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedChannels.map(id => {
                      const channel = channels.find(c => c.id === id);
                      return (
                        <div key={id} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-sm font-medium text-foreground">
                          {channel.platform}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No channels selected yet.</p>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border mt-6">
                <Button variant="ghost" onClick={handleBack}>Back</Button>
                <div className="flex items-center gap-3">
                  {(!selectedFile && postType !== 'text') && <span className="text-xs text-red-500 font-medium">Media required</span>}
                  {(caption.trim().length === 0 && postType === 'text') && <span className="text-xs text-red-500 font-medium">Text required</span>}
                  {(selectedChannels.length === 0) && <span className="text-xs text-red-500 font-medium">Select a channel</span>}
                  
                  <Button 
                    onClick={handleNext} 
                    disabled={selectedChannels.length === 0 || (postType !== 'text' && !selectedFile) || (postType === 'text' && caption.trim().length === 0)}
                  >
                    Schedule Post
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Scheduled Successfully!</h3>
              <p className="text-muted-foreground mb-8">
                Your post will be published on {format(selectedDate, 'MMM d, yyyy')} at {time} ({timezone.split('/').pop().replace('_', ' ')}).
              </p>
              <Button onClick={resetAndClose}>Back to Calendar</Button>
            </div>
          )}
        </div>
      </Modal>

      <SlidePanel 
        isOpen={isChannelsPanelOpen} 
        onClose={() => setIsChannelsPanelOpen(false)}
        title="Select Channels"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">Choose the platforms where you want to publish this post.</p>
          {channels.map(channel => {
            const isSelected = selectedChannels.includes(channel.id);
            const isConnected = channel.status === 'connected';
            const isUnsupported = postType === 'text' && ['instagram', 'youtube'].includes(channel.platform.toLowerCase());
            const isDisabled = !isConnected || isUnsupported;
            
            return (
              <Card 
                key={channel.id} 
                className={`transition-all ${!isDisabled ? 'cursor-pointer hover:border-primary/30' : 'cursor-not-allowed opacity-60 grayscale'} ${isSelected ? 'border-primary ring-1 ring-primary' : ''}`}
                onClick={() => !isDisabled && toggleChannel(channel.id)}
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-lg">
                      {channel.platform[0]}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{channel.platform}</p>
                      <p className={`text-xs ${isConnected && !isUnsupported ? 'text-green-600' : isUnsupported ? 'text-orange-500 font-medium' : 'text-gray-500'}`}>
                        {!isConnected ? 'Not Connected' : isUnsupported ? 'Requires Image/Video' : 'Connected'}
                      </p>
                    </div>
                  </div>
                  {isConnected && !isUnsupported && (
                    <div className={`w-5 h-5 rounded border ${isSelected ? 'bg-primary border-primary flex items-center justify-center' : 'border-gray-300'}`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  )}
                  {!isConnected && (
                    <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); }}>
                      Connect
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
          
          <div className="mt-8 pt-6 border-t border-border">
            <Button fullWidth onClick={() => setIsChannelsPanelOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </SlidePanel>
    </>
  );
}
