"use client";
import { useState, FormEvent } from 'react';

export default function EmailCapture() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Replace these two strings with your Google Form details
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
      
      // Auto-close the modal after 3 seconds
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false); // Reset for the next person
      }, 3000);
    }).catch((err) => console.error("Error submitting email", err));
  };

  return (
    <>
      {/* 1. The Trigger Button (This sits on your home page) */}
      <button 
        onClick={() => setIsOpen(true)} 
        className="px-6 py-3 rounded-xl bg-transparent border border-[#CCFF00] text-[#CCFF00] font-bold hover:bg-[rgba(204,255,0,0.1)] transition-all"
      >
        Get FPL alerts before GW1
      </button>

      {/* 2. The Modal Overlay (Only shows when isOpen is true) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          {/* Modal Box */}
          <div className="relative w-full max-w-md p-8 bg-[#0D1317] border border-[#2A3B47] rounded-2xl shadow-2xl">
            
            {/* Close (X) Button */}
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-[#8E9BAE] hover:text-white transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <h3 className="text-2xl font-display font-bold text-white mb-2">FPL Scout Alerts</h3>
            <p className="text-sm text-[#8E9BAE] mb-6">Drop your email to get our FPL cheat sheet right before Gameweek 1 kicks off.</p>

            {/* Success State vs Form State */}
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
      )}
    </>
  );
}
