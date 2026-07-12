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
      className="flex min-h-screen w-full flex-col"
      style={{
        backgroundColor: "var(--canvas)",
        transition: "background-color 150ms ease",
      }}
    >
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-[var(--sidebar-width)]">
        <TopBar />
        <main
          className="w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 lg:px-8"
          style={{ backgroundColor: "var(--canvas)" }}
        >
          {title ? (
            <h1
              className="font-display mb-4 text-2xl leading-tight sm:text-3xl"
              style={{ color: "var(--text-1)" }}
            >
              {title}
            </h1>
          ) : null}
          <div className="mx-auto w-full max-w-7xl min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}

