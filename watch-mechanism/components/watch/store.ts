import { create } from "zustand";
import { Vector3 } from "three";

export type WatchLayer =
  | "baseplate"
  | "gearTrain"
  | "escapement"
  | "balanceAssembly"
  | "hands";

export type FocusTarget = "overview" | WatchLayer | "mainspring" | "jewelTrain";

export type WatchPart =
  | "baseplate"
  | "centerWheel"
  | "thirdWheel"
  | "fourthWheel"
  | "escapeWheel"
  | "palletFork"
  | "balanceWheel"
  | "hairspring"
  | "mainspring"
  | "barrel"
  | "minuteHand"
  | "hourHand"
  | "dialTrain"
  | "crownWheel";

type FocusDescriptor = {
  position: Vector3;
  target: Vector3;
};

const focusMap: Record<FocusTarget, FocusDescriptor> = {
  overview: {
    position: new Vector3(0, 8, 14),
    target: new Vector3(0, 0, 0),
  },
  baseplate: {
    position: new Vector3(0, 6, 12),
    target: new Vector3(0, -0.5, 0),
  },
  gearTrain: {
    position: new Vector3(-6, 5, 8),
    target: new Vector3(-1, 1.5, 0),
  },
  escapement: {
    position: new Vector3(5, 4, 6),
    target: new Vector3(2, 2.5, 0),
  },
  balanceAssembly: {
    position: new Vector3(4, 5, 8),
    target: new Vector3(0, 3.5, 0),
  },
  hands: {
    position: new Vector3(0, 3, 8),
    target: new Vector3(0, 5, 0),
  },
  mainspring: {
    position: new Vector3(-4, 4, 7),
    target: new Vector3(-2, 1.2, 0),
  },
  jewelTrain: {
    position: new Vector3(3, 4, 8),
    target: new Vector3(1.5, 1.5, 0),
  },
};

export const useWatchStore = create<{
  visibleLayers: Record<WatchLayer, boolean>;
  animationSpeed: number;
  focusTarget: FocusTarget;
  focusDescriptor: FocusDescriptor;
  selectedPart: WatchPart | null;
  toggleLayer: (layer: WatchLayer) => void;
  setLayerVisibility: (layer: WatchLayer, visible: boolean) => void;
  setAnimationSpeed: (speed: number) => void;
  setFocusTarget: (target: FocusTarget) => void;
  setSelectedPart: (part: WatchPart | null) => void;
}>((set) => ({
  visibleLayers: {
    baseplate: true,
    gearTrain: true,
    escapement: true,
    balanceAssembly: true,
    hands: true,
  },
  animationSpeed: 1,
  focusTarget: "overview",
  focusDescriptor: focusMap.overview,
  selectedPart: null,
  toggleLayer: (layer) =>
    set((state) => ({
      visibleLayers: {
        ...state.visibleLayers,
        [layer]: !state.visibleLayers[layer],
      },
    })),
  setLayerVisibility: (layer, visible) =>
    set((state) => ({
      visibleLayers: { ...state.visibleLayers, [layer]: visible },
    })),
  setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
  setFocusTarget: (target) => set({ focusTarget: target, focusDescriptor: focusMap[target] }),
  setSelectedPart: (part) => set({ selectedPart: part }),
}));

export const watchPartLabels: Record<WatchPart, string> = {
  baseplate: "Baseplate",
  mainspring: "Main Spring",
  barrel: "Barrel",
  centerWheel: "Center Wheel",
  thirdWheel: "Third Wheel",
  fourthWheel: "Fourth Wheel",
  escapeWheel: "Escape Wheel",
  palletFork: "Pallet Fork",
  balanceWheel: "Balance Wheel",
  hairspring: "Hairspring",
  minuteHand: "Minute Hand",
  hourHand: "Hour Hand",
  dialTrain: "Dial Train",
  crownWheel: "Crown Wheel",
};

export const watchPartDescriptions: Record<WatchPart, string> = {
  baseplate:
    "The baseplate is the structural chassis of the movement, maintaining precise alignment of all bridges, posts, and jewels.",
  mainspring:
    "The mainspring stores energy inside a coiled strip of metal. As it unwinds it powers the entire movement via the barrel.",
  barrel:
    "The barrel encloses the mainspring and smooths its torque delivery through its toothed perimeter.",
  centerWheel:
    "The center wheel rotates once per hour and drives the motion works that control the hands.",
  thirdWheel:
    "The third wheel transfers torque from the center wheel to the fourth wheel with a ratio chosen for minute indication.",
  fourthWheel:
    "The fourth wheel rotates once per minute, directly driving the seconds indication and providing input to the escapement.",
  escapeWheel:
    "The escape wheel meters energy pulses to the balance via sharply profiled teeth that interact with the pallet fork.",
  palletFork:
    "The pallet fork alternately locks and releases the escapement, delivering short impulses to the balance wheel.",
  balanceWheel:
    "The balance wheel oscillates at a steady frequency, regulating the entire watch with its inertia and hairspring.",
  hairspring:
    "The hairspring provides the restoring force for the balance, ensuring consistent oscillations.",
  minuteHand:
    "The minute hand is geared to complete one rotation every hour, indicating minutes on the dial.",
  hourHand:
    "The hour hand rotates once every 12 hours and sits beneath the minute hand for easy legibility.",
  dialTrain:
    "The dial train converts the gear train rotation into the geared ratios required for the hands.",
  crownWheel:
    "The crown wheel couples the winding stem to the mainspring barrel, transmitting torque during winding.",
};
