"use client";
import { useState, FormEvent } from 'react';

export default function EmailCapture() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Add the TypeScript type here 👇
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // We'll replace these two strings in Step 3
    const googleFormActionUrl = "YOUR_GOOGLE_FORM_URL_HERE";
    const googleFormEntryId = "entry.123456789"; 

    const formData = new FormData();
    formData.append(googleFormEntryId, email);

    // mode: 'no-cors' is the magic trick that lets you submit to Google Forms without CORS errors
    fetch(googleFormActionUrl, {
      method: "POST",
      body: formData,
      mode: "no-cors" 
    }).then(() => {
      setSubmitted(true);
      setEmail('');
    }).catch((err) => console.error("Error submitting email", err));
  };

  if (submitted) {
    return (
      <div className="p-4 mt-6 text-center text-[#CCFF00] border border-[#CCFF00] bg-[rgba(204,255,0,0.1)] rounded-xl max-w-md mx-auto">
        Thanks! You're on the list for GW1 alerts.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-8">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email..."
        className="flex-1 px-4 py-3 rounded-xl bg-[#1A242B] border border-[#2A3B47] text-white focus:outline-none focus:border-[#CCFF00] transition-colors"
      />
      <button 
        type="submit" 
        className="px-6 py-3 rounded-xl bg-[#CCFF00] text-[#0a1000] font-bold whitespace-nowrap hover:bg-[#E8FF66] hover:-translate-y-0.5 transition-all"
      >
        Get FPL alerts before GW1
      </button>
    </form>
  );
}
