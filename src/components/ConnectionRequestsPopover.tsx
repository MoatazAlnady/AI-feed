import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Users } from 'lucide-react';
import ConnectionRequestsModal from './ConnectionRequestsModal';

interface ConnectionRequestsPopoverProps {
  connectionRequestsCount: number;
}

const ConnectionRequestsPopover: React.FC<ConnectionRequestsPopoverProps> = ({
  connectionRequestsCount
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Open/close handlers
  const toggle = () => setOpen(v => !v);
  const close = () => setOpen(false);

  // Click-outside listener (capture phase)
  useEffect(() => {
    if (!open) return;
    
    console.log('Setting up click-outside listener');
    
    const onDown = (e: MouseEvent | TouchEvent) => {
      console.log('Click detected:', e.target);
      const target = e.target as Node;
      
      if (panelRef.current?.contains(target)) {
        console.log('Click inside panel - ignoring');
        return;   // inside panel
      }
      if (triggerRef.current?.contains(target)) {
        console.log('Click on trigger - ignoring');
        return; // the icon itself
      }
      
      console.log('Click outside - closing panel');
      close();
    };
    
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('touchstart', onDown, true);
    
    return () => {
      console.log('Removing click-outside listener');
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('touchstart', onDown, true);
    };
  }, [open]);

  // Esc to close + focus restore
  useEffect(() => {
    if (!open) return;
    
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
        triggerRef.current?.focus();
      }
    };
    
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open]);

  // Close on route changes / navigation
  useEffect(() => {
    close();
  }, [location.pathname]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="conn-req-panel"
        onClick={toggle}
        type="button"
        className="relative p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        title="Connection Requests"
      >
        <Users className="h-5 w-5" />
        {connectionRequestsCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {connectionRequestsCount}
          </span>
        )}
      </button>
      
      {/* Optional invisible backdrop (helps capture outside clicks on mobile) */}
      {open && (
        <div 
          aria-hidden 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={close} 
        />
      )}
      
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50">
          <div 
            ref={panelRef}
            id="conn-req-panel"
            role="dialog"
            aria-modal="false"
            aria-labelledby="conn-req-title"
            className="relative z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-md w-80 max-h-96 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <ConnectionRequestsModal 
              open={true} 
              onOpenChange={setOpen}
              isInline={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionRequestsPopover;