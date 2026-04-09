"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        style: {
          background: "#0b0f16",
          color: "#ffffff",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
        className: "font-sans tracking-wider text-[10px] font-black",
      }}
      style={
        {
          "--normal-bg": "#0b0f16",
          "--normal-text": "#ffffff",
          "--normal-border": "rgba(255, 255, 255, 0.1)",
          "--success-text": "#34d399",
          "--error-text": "#f87171",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
