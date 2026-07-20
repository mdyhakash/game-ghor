import { RiPhoneLine, RiMapPin2Line } from "react-icons/ri";
import { CAFE_PHONE, CAFE_PHONE_DISPLAY, CAFE_ADDRESS } from "@/lib/data";
const Footer = () => {
  return (
    <footer className="mx-4.5 md:mx-0 mt-6 pt-5 border-t border-line text-center md:text-left">
      <div className="font-display text-base font-bold flex items-center justify-center md:justify-start gap-2">
        <span className="w-2 h-2 rounded-sm bg-lime shadow-[0_0_8px_var(--lime)]" />
        Game Ghor
      </div>
      <div className="text-[12px] text-text-dim mt-1.5 flex items-center justify-center md:justify-start gap-1">
        <RiMapPin2Line size={14} className="text-text-dim" />
        {CAFE_ADDRESS}
      </div>
      <div className="text-[12px] text-text-dim mt-1 flex items-center justify-center md:justify-start gap-1">
        <RiPhoneLine size={14} className="text-lime" />
        Open till 1AM · Call to book:{" "}
        <a href={`tel:${CAFE_PHONE}`} className="text-lime font-semibold">
          {CAFE_PHONE_DISPLAY}
        </a>
      </div>
      <div className="text-[11px] text-text-dim/70 mt-3">
        © {new Date().getFullYear()} Game Ghor Gaming Lounge. All rights
        reserved.
      </div>
    </footer>
  );
};

export default Footer;
