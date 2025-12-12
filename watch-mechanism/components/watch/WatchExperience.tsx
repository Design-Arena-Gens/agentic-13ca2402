"use client";

import dynamic from "next/dynamic";
import { ControlsPanel } from "./ControlsPanel";

const WatchScene = dynamic(() => import("./WatchScene"), {
  ssr: false,
});

export function WatchExperience() {
  return (
    <div className="flex min-h-screen flex-col gap-6 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 px-6 py-8 text-zinc-100 md:flex-row md:gap-8 md:px-10 md:py-12">
      <div className="flex h-[520px] flex-1 rounded-3xl md:h-auto">
        <WatchScene />
      </div>
      <div className="md:h-auto md:w-[320px]">
        <ControlsPanel />
      </div>
    </div>
  );
}
