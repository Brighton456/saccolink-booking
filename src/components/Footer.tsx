import * as I from "@/icons";

export default function Footer() {
  return (
    <footer className="mt-auto bg-gray-900 pb-8 pt-16 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <div className="mb-5 flex items-center">
              <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#16a34a] text-lg font-bold shadow">S</div>
              <span className="text-2xl font-extrabold tracking-tight">SaccoLink</span>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-gray-400">
              Reliable, safe, and comfortable transport. Book your seat or send parcels online.
            </p>
          </div>

          <div>
            <h4 className="mb-5 text-lg font-bold">Services</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2 transition hover:text-[#22c55e]">
                <I.Bus className="h-4 w-4" /> Book a Trip
              </li>
              <li className="flex items-center gap-2 transition hover:text-[#22c55e]">
                <I.Package className="h-4 w-4" /> Send a Parcel
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-lg font-bold">Support</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="cursor-pointer transition hover:text-[#22c55e]">Help Center</li>
              <li className="cursor-pointer transition hover:text-[#22c55e]">Terms of Service</li>
              <li className="cursor-pointer transition hover:text-[#22c55e]">Privacy Policy</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-lg font-bold">Contact</h4>
            <ul className="mb-6 space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-800 p-2 text-[#22c55e]"><I.Phone className="h-5 w-5" /></div>
                +254 700 000 000
              </li>
              <li className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-800 p-2 text-[#22c55e]"><I.Headphones className="h-5 w-5" /></div>
                support@saccolink.co.ke
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between border-t border-gray-800 pt-8 text-sm text-gray-500 md:flex-row">
          <p>&copy; {new Date().getFullYear()} SaccoLink. All rights reserved.</p>
          <p className="mt-2 font-medium md:mt-0">Powered by BrightPay</p>
        </div>
      </div>
    </footer>
  );
}
