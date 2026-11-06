"use client";

import { createContext, useContext } from "react";

/** Line vs bar for time-series widgets. Chosen once at page level and applied to every chart. */
export type ChartKind = "line" | "bar";

export const ChartKindContext = createContext<ChartKind>("line");

export const useChartKind = (): ChartKind => useContext(ChartKindContext);
