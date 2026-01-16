import AppLayout from "./AppLayout";
import { Toaster } from "react-hot-toast";

export function MainLayout() {
  return (
    <>
      <Toaster position="top-right" />
      <AppLayout />
    </>
  );
}
