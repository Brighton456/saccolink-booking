import * as I from "@/icons";

export default function Footer() {
  return (
    <footer className="mt-auto bg-gray-900 pb-8 pt-16 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <div className="mb-5 flex items-center">
              <img src="/kangaroo-logo.png" alt="Kangaroo Shuttle" className="mr-2 h-10 w-auto" style={{ mixBlendMode: "screen" }} />
              <span className="text-2xl font-extrabold tracking-tight">Kangaroo <span className="text-[#B8A94E]">Shuttle</span></span>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-gray-400">
              Reliable, safe, and comfortable transport across Kenya. Book your seat or send parcels online — no queues, no hassle.
            </p>
            <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Our Mission</p>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-300">
                To modernize public transport in Kenya by giving passengers the power to book, pay, and track their journeys from anywhere — making every trip transparent, safe, and affordable.
              </p>
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-lg font-bold">Services</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2 transition hover:text-[#B8A94E]">
                <I.Bus className="h-4 w-4" /> Book a Trip
              </li>
              <li className="flex items-center gap-2 transition hover:text-[#B8A94E]">
                <I.Package className="h-4 w-4" /> Send a Parcel
              </li>
              <li className="flex items-center gap-2 transition hover:text-[#B8A94E]">
                <I.MapPin className="h-4 w-4" /> Track Your Route
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-lg font-bold">Support</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="cursor-pointer transition hover:text-[#B8A94E]">Help Center</li>
              <li className="cursor-pointer transition hover:text-[#B8A94E]">Terms of Service</li>
              <li className="cursor-pointer transition hover:text-[#B8A94E]">Privacy Policy</li>
              <li className="cursor-pointer transition hover:text-[#B8A94E]">Refund Policy</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-lg font-bold">Contact Us</h4>
            <ul className="mb-6 space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-3">
                <div className="rounded-lg bg-[#8B7D3C]/20 p-2 text-[#B8A94E]"><I.Phone className="h-5 w-5" /></div>
                <div>
                  <p className="font-bold text-white">0720 363 215</p>
                  <p className="text-xs text-gray-500">Call / WhatsApp</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-800 p-2 text-[#B8A94E]"><I.Headphones className="h-5 w-5" /></div>
                support@saccolink.co.ke
              </li>
            </ul>
            <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">24/7 Support</p>
              <p className="mt-1 text-xs text-gray-400">We're here to help with bookings, payments, and parcels.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between border-t border-gray-800 pt-8 text-sm text-gray-500 md:flex-row">
          <p>&copy; {new Date().getFullYear()} Kangaroo Shuttle. All rights reserved.</p>
          <p className="mt-2 font-medium md:mt-0">Powered by BrightPay M-Pesa</p>
        </div>
      </div>
    </footer>
  );
}
