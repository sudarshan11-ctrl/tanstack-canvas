import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function PageWrapper({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
  breadcrumb?: string[];
}) {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--canvas)",
        transition: "background-color 150ms ease",
      }}
    >
      <Sidebar />
      <div
        className="flex min-h-screen flex-col md:ml-[var(--sidebar-width)]"
      >
        <TopBar />
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ backgroundColor: "var(--canvas)" }}
        >
          {title ? (
            <h1
              className="font-display mb-4 text-[32px] leading-tight"
              style={{ color: "var(--text-1)" }}
            >
              {title}
            </h1>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
