// src/v2/components/Nav.jsx
//
// Composes the responsive app shell: Sidebar (persistent left rail,
// desktop) + BottomNav (tab bar, mobile) as breakpoint variants of one
// shell, replacing the single top nav bar this used to be directly.
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

export default function Nav() {
  return (
    <>
      <Sidebar />
      <BottomNav />
    </>
  );
}
