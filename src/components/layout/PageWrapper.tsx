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
      <div className="flex min-h-screen flex-col md:ml-[var(--sidebar-width)]">
        <TopBar />
        <main
          className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6"
          style={{ backgroundColor: "var(--canvas)" }}
        >
          <div className="mx-auto w-full max-w-7xl">
            {title ? (
              <h1
                className="font-display mb-4 text-2xl leading-tight sm:text-3xl"
                style={{ color: "var(--text-1)" }}
              >
                {title}
              </h1>
            ) : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
