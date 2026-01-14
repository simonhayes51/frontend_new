import { useMediaQuery } from "../../hooks/useMediaQuery";
import DesktopLayout from "./DesktopLayout";
import MobileLayout from "./MobileLayout";

export default function AppLayout() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
}

