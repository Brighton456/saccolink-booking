import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as I from "@/icons";

const faqs = [
  {
    q: "How do I book a ticket?",
    a: "Search for your route on the home page, select a trip, choose your seat(s), and complete payment via M-Pesa or cash.",
  },
  {
    q: "Can I cancel my booking?",
    a: "Yes. Contact our support team at least 2 hours before departure. Refunds are processed within 24 hours.",
  },
  {
    q: "How do I pay via M-Pesa?",
    a: "Select M-Pesa at checkout. You'll receive an STK push on your phone. Enter your M-Pesa PIN to complete payment.",
  },
  {
    q: "What happens if I miss my trip?",
    a: "Contact support immediately. We can transfer your booking to the next available trip on the same route, subject to availability.",
  },
  {
    q: "Can I book for someone else?",
    a: "Yes. Enter the passenger's name and phone number during checkout. They'll need to show the ticket to the conductor.",
  },
  {
    q: "Is my receipt valid as a ticket?",
    a: "Yes. Show the digital receipt (with receipt code) to the conductor when boarding. A valid receipt is your boarding pass.",
  },
];

export default function SupportView() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen animate-fade-in bg-[var(--scl-surface-alt)] pb-8">
      <div className="sticky top-0 z-40 border-b border-[var(--scl-border)] bg-[var(--scl-card)] py-4 shadow-sm">
        <div className="mx-auto max-w-2xl px-4">
          <h1 className="text-xl font-extrabold text-[var(--scl-text)]">Support</h1>
          <p className="text-xs text-[var(--scl-text-secondary)]">We're here to help</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* Quick contact cards */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href="tel:+254720363215"
            className="flex flex-col items-center rounded-2xl border border-[var(--scl-border)] bg-[var(--scl-card)] p-5 shadow-sm transition hover:shadow-md active:scale-[0.98]"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <I.Phone className="h-6 w-6 text-emerald-500" />
            </div>
            <span className="text-sm font-bold text-[var(--scl-text)]">Call Us</span>
            <span className="mt-1 text-xs text-[var(--scl-text-secondary)]">0720 363 215</span>
          </a>
          <a
            href="https://wa.me/254720363215"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center rounded-2xl border border-[var(--scl-border)] bg-[var(--scl-card)] p-5 shadow-sm transition hover:shadow-md active:scale-[0.98]"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <I.Phone className="h-6 w-6 text-green-500" />
            </div>
            <span className="text-sm font-bold text-[var(--scl-text)]">WhatsApp</span>
            <span className="mt-1 text-xs text-[var(--scl-text-secondary)]">Chat with us</span>
          </a>
        </div>

        {/* Service hours */}
        <div className="rounded-2xl border border-[var(--scl-border)] bg-[var(--scl-card)] p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <I.Calendar className="h-5 w-5 text-[#8B7D3C]" />
            <h3 className="text-sm font-bold text-[var(--scl-text)]">Service Hours</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--scl-text-secondary)]">Monday – Saturday</span>
              <span className="font-semibold text-[var(--scl-text)]">5:00 AM – 9:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--scl-text-secondary)]">Sunday & Holidays</span>
              <span className="font-semibold text-[var(--scl-text)]">6:00 AM – 8:00 PM</span>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="mb-3 text-lg font-extrabold text-[var(--scl-text)]">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[var(--scl-border)] bg-[var(--scl-card)] shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <span className="text-sm font-semibold text-[var(--scl-text)] pr-4">{faq.q}</span>
                  <I.ArrowRight
                    className={`h-4 w-4 flex-shrink-0 text-[var(--scl-text-secondary)] transition-transform ${
                      openFaq === i ? "rotate-90" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="border-t border-[var(--scl-border)] px-4 py-3">
                    <p className="text-sm text-[var(--scl-text-secondary)]">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* About Kangaroo */}
        <div className="rounded-2xl border border-[#8B7D3C]/20 bg-[#8B7D3C]/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🦘</span>
            <h3 className="text-sm font-bold text-[#8B7D3C]">About Kangaroo Shuttle</h3>
          </div>
          <p className="text-xs leading-relaxed text-[var(--scl-text-secondary)]">
            Over the past 20 years, Kangaroo Shuttle has evolved to become an entity of choice in the transportation industry.
            We provide safe, reliable and competitive transport services across Kenya's major routes.
          </p>
        </div>
      </div>
    </div>
  );
}
