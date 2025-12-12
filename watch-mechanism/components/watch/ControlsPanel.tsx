"use client";

import { useMemo } from "react";
import {
  FocusTarget,
  useWatchStore,
  watchPartDescriptions,
  watchPartLabels,
  WatchLayer,
} from "./store";

const orderedLayers: { id: WatchLayer; label: string }[] = [
  { id: "baseplate", label: "Baseplate" },
  { id: "gearTrain", label: "Gear Train" },
  { id: "escapement", label: "Escapement" },
  { id: "balanceAssembly", label: "Balance & Hairspring" },
  { id: "hands", label: "Hands & Dial Train" },
];

const focusTargets: { id: FocusTarget; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "mainspring", label: "Mainspring Barrel" },
  { id: "gearTrain", label: "Gear Train" },
  { id: "escapement", label: "Escapement" },
  { id: "balanceAssembly", label: "Balance Assembly" },
  { id: "hands", label: "Hands" },
  { id: "jewelTrain", label: "Jeweling" },
];

export function ControlsPanel() {
  const visibleLayers = useWatchStore((state) => state.visibleLayers);
  const toggleLayer = useWatchStore((state) => state.toggleLayer);
  const animationSpeed = useWatchStore((state) => state.animationSpeed);
  const setAnimationSpeed = useWatchStore((state) => state.setAnimationSpeed);
  const focusTarget = useWatchStore((state) => state.focusTarget);
  const setFocusTarget = useWatchStore((state) => state.setFocusTarget);
  const selectedPart = useWatchStore((state) => state.selectedPart);
  const setSelectedPart = useWatchStore((state) => state.setSelectedPart);

  const selectedDescription = useMemo(() => {
    if (!selectedPart) return null;
    return {
      label: watchPartLabels[selectedPart],
      description: watchPartDescriptions[selectedPart],
    };
  }, [selectedPart]);

  return (
    <aside className="flex h-full w-full flex-col gap-6 rounded-xl border border-zinc-900/10 bg-white/85 p-5 shadow-lg backdrop-blur-md md:w-80 dark:border-white/10 dark:bg-zinc-900/80">
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-100">
          Layer Visibility
        </h2>
        <div className="flex flex-col gap-2">
          {orderedLayers.map((layer) => (
            <label key={layer.id} className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2 hover:border-zinc-300 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{layer.label}</span>
              <input
                type="checkbox"
                checked={visibleLayers[layer.id]}
                onChange={() => toggleLayer(layer.id)}
                className="h-4 w-4 accent-zinc-900 dark:accent-zinc-200"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-100">
          Focus Targets
        </h2>
        <div className="grid grid-cols-2 gap-2 text-sm font-medium">
          {focusTargets.map((target) => (
            <button
              key={target.id}
              onClick={() => setFocusTarget(target.id)}
              className={`rounded-lg border px-3 py-2 transition ${
                focusTarget === target.id
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-200 dark:bg-zinc-200 dark:text-black"
                  : "border-zinc-300 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              {target.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-100">
          Animation Speed
        </h2>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={animationSpeed}
            onChange={(event) => setAnimationSpeed(Number(event.target.value))}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-200 dark:bg-zinc-700"
          />
          <span className="w-10 text-right text-sm font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">
            {animationSpeed.toFixed(2)}×
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <h2 className="text-base font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-100">
          Inspection
        </h2>
        <div className="flex-1 rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
          {selectedDescription ? (
            <div className="flex h-full flex-col gap-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-zinc-800 dark:text-zinc-100">
                {selectedDescription.label}
              </p>
              <p className="leading-relaxed">{selectedDescription.description}</p>
              <button
                onClick={() => {
                  setFocusTarget(selectedDescription.label.toLowerCase().includes("wheel") ? "gearTrain" : "overview");
                  setSelectedPart(null);
                }}
                className="mt-auto self-start rounded-full border border-zinc-700 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-zinc-700 hover:bg-zinc-100 dark:border-zinc-200 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Reset Inspection
              </button>
            </div>
          ) : (
            <p className="leading-relaxed">
              Click on any element inside the watch to surface richly annotated details about its mechanical function.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
