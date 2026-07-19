import {
  RiComputerLine,
  RiGamepadLine,
  RiMedalLine,
  RiAwardLine,
  RiTrophyLine,
  RiVipDiamondLine,
} from "react-icons/ri";
import type { IconType } from "react-icons";

/** Map of icon keys → react-icon components */
const ICON_MAP: Record<string, IconType> = {
  PC: RiComputerLine,
  PS5: RiGamepadLine,
  PS4: RiGamepadLine,      // or choose another icon
  BRONZE: RiMedalLine,
  SILVER: RiAwardLine,
  GOLD: RiTrophyLine,
  DIAMOND: RiVipDiamondLine,
};

interface GameIconProps {
  iconKey: string;
  className?: string;
  size?: number | string;
}

/** Renders the correct react-icon for a given iconKey from DEVICE_META or TIER_INFO */
export default function GameIcon({ iconKey, className, size = "1.25em" }: GameIconProps) {
  const Icon = ICON_MAP[iconKey];
  if (!Icon) return null;
  return <Icon size={size} className={className} style={{ display: "inline-block", verticalAlign: "middle" }} />;
}
