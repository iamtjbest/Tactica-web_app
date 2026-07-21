"use client";
import { useState, useEffect, FormEvent } from 'react';
import { usePathname } from 'next/navigation';

export default function EmailCapture() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // 1. Ensure we only run this on the client side
    if (typeof window === 'undefined') return;

    // 2. If they already submitted or closed it, never bother them again
    if (localStorage.getItem('fpl_modal_handled')) return;

    // 3. Define the actual module routes
    const moduleRoutes = ['/tactics', '/opponent', '/sandbox', '/simulator', '/chat', '/fpl'];
    
    if (moduleRoutes.includes(pathname)) {
      // Get array of visited modules, or start a new one
      const visited = JSON.parse(localStorage.getItem('tactica_modules_used') || '[]');
      
      // If this specific module hasn't been visited yet, add it
      if (!visited.includes(pathname)) {
        visited.push(pathname);
        localStorage.setItem('tactica_modules_used', JSON.stringify(visited));
      }

      // 4. If they have now used 2 modules, trigger the modal!
      if (visited.length === 2) {
        // Wait 3 seconds so they can see the module first before interrupting
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [pathname]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('fpl_modal_handled', 'true');
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const googleFormActionUrl = "YOUR_GOOGLE_FORM_URL_HERE";
    const googleFormEntryId = "entry.123456789"; 

    const formData = new FormData();
    formData.append(googleFormEntryId, email);

    fetch(googleFormActionUrl, {
      method: "POST",
      body: formData,
      mode: "no-cors" 
    }).then(() => {
      setSubmitted(true);
      setEmail('');
      localStorage.setItem('fpl_modal_handled', 'true'); // Don't show again
      
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);
    }).catch((err) => console.error("Error submitting email", err));
  };

  // If it's not open, render absolutely nothing
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-8 bg-[#0D1317] border border-[#2A3B47] rounded-2xl shadow-2xl">
        
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#8E9BAE] hover:text-white transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <h3 className="text-2xl font-display font-bold text-white mb-2">FPL Scout Alerts</h3>
        <p className="text-sm text-[#8E9BAE] mb-6">Drop your email to get our FPL cheat sheet right before Gameweek 1 kicks off.</p>

        {submitted ? (
          <div className="p-4 text-center text-[#CCFF00] border border-[#CCFF00] bg-[rgba(204,255,0,0.1)] rounded-xl">
            Thanks! You're on the list.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email..."
              className="px-4 py-3 rounded-xl bg-[#1A242B] border border-[#2A3B47] text-white focus:outline-none focus:border-[#CCFF00] transition-colors"
            />
            <button 
              type="submit" 
              className="px-6 py-3 rounded-xl bg-[#CCFF00] text-[#0a1000] font-bold hover:bg-[#E8FF66] transition-all"
            >
              Join Waitlist
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
