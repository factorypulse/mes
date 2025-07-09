'use client';

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";


export function Provider(props: { children?: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class">
      {props.children}
      <Toaster />
    </ThemeProvider>
  );
}