import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';

const ScrollColumn = ({ items, selected, onSelect, width = 'w-20' }) => {
  const containerRef = useRef(null);
  const isProgrammaticScroll = useRef(false);

  useEffect(() => {
    if (containerRef.current && !isProgrammaticScroll.current) {
      const index = items.indexOf(selected);
      if (index !== -1) {
        isProgrammaticScroll.current = true;
        containerRef.current.scrollTo({ top: index * 48, behavior: 'smooth' });
        setTimeout(() => { isProgrammaticScroll.current = false; }, 300);
      }
    }
  }, [selected, items]);

  const handleScroll = (e) => {
    if (isProgrammaticScroll.current) return;
    const scrollTop = e.target.scrollTop;
    const index = Math.round(scrollTop / 48);
    if (index >= 0 && index < items.length && items[index] !== selected) {
      onSelect(items[index]);
    }
  };

  const handleItemClick = (item, index) => {
    isProgrammaticScroll.current = true;
    containerRef.current.scrollTo({ top: index * 48, behavior: 'smooth' });
    onSelect(item);
    setTimeout(() => { isProgrammaticScroll.current = false; }, 300);
  };

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className={`${width} h-48 overflow-y-auto hide-scrollbar relative`}
      style={{ scrollSnapType: 'y mandatory' }}
    >
      <div className="h-[72px]" />
      {items.map((item, index) => (
        <div 
          key={item}
          onClick={() => handleItemClick(item, index)}
          className={`h-12 flex items-center justify-center cursor-pointer text-2xl font-bold transition-colors ${selected === item ? 'text-primary' : 'text-muted-foreground/40 hover:text-foreground/60'}`}
          style={{ scrollSnapAlign: 'center' }}
        >
          {item}
        </div>
      ))}
      <div className="h-[72px]" />
    </div>
  );
};

export function TimeScrollPicker({ value, onChange, onClose }) {
  const [draftTime, setDraftTime] = useState(value || '10:00');
  
  const currentH24 = parseInt(draftTime.split(':')[0], 10) || 0;
  const currentM = parseInt(draftTime.split(':')[1], 10) || 0;
  
  const isPM = currentH24 >= 12;
  const currentH12 = currentH24 % 12 === 0 ? 12 : currentH24 % 12;

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  const ampm = ['AM', 'PM'];

  const handleHourChange = (hStr) => {
    const h = parseInt(hStr, 10);
    let newH24 = h;
    if (isPM && h !== 12) newH24 += 12;
    if (!isPM && h === 12) newH24 = 0;
    
    const formattedH = newH24.toString().padStart(2, '0');
    const formattedM = currentM.toString().padStart(2, '0');
    setDraftTime(`${formattedH}:${formattedM}`);
  };

  const handleMinuteChange = (mStr) => {
    const formattedH = currentH24.toString().padStart(2, '0');
    setDraftTime(`${formattedH}:${mStr}`);
  };

  const handleAmPmChange = (period) => {
    const newIsPM = period === 'PM';
    let newH24 = currentH24;
    if (newIsPM && !isPM && currentH12 !== 12) newH24 += 12;
    if (newIsPM && !isPM && currentH12 === 12) newH24 = 12;
    if (!newIsPM && isPM && currentH12 !== 12) newH24 -= 12;
    if (!newIsPM && isPM && currentH12 === 12) newH24 = 0;
    
    const formattedH = newH24.toString().padStart(2, '0');
    const formattedM = currentM.toString().padStart(2, '0');
    setDraftTime(`${formattedH}:${formattedM}`);
  };

  const handleContinue = () => {
    onChange(draftTime);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="p-6 bg-card border border-border shadow-2xl rounded-[32px] flex flex-col items-center animate-in zoom-in-95 w-[340px]" 
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-6">Select Time</h3>
        
        <div className="flex items-center gap-2 mb-8 relative w-full justify-center px-4">
          {/* Highlight overlay for center item */}
          <div className="absolute top-1/2 left-4 right-4 h-12 -translate-y-1/2 bg-primary/10 rounded-xl pointer-events-none" />
          
          <ScrollColumn 
            items={hours} 
            selected={currentH12.toString().padStart(2, '0')} 
            onSelect={handleHourChange} 
          />
          <span className="text-3xl font-bold text-foreground pb-1">:</span>
          <ScrollColumn 
            items={minutes} 
            selected={currentM.toString().padStart(2, '0')} 
            onSelect={handleMinuteChange} 
          />
          <div className="w-4" /> {/* Spacer */}
          <ScrollColumn 
            items={ampm} 
            selected={isPM ? 'PM' : 'AM'} 
            onSelect={handleAmPmChange} 
            width="w-16"
          />
        </div>
        
        <div className="flex justify-end w-full gap-3">
          <Button variant="ghost" onClick={onClose} className="px-5">Cancel</Button>
          <Button variant="primary" onClick={handleContinue} className="px-6 rounded-xl">Continue</Button>
        </div>
      </div>
      
      {/* Inject custom CSS for hiding scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
