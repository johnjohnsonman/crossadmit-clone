import { runRoutedBatch, type RoutedRawItem } from "@/lib/scrapers/run-routed-batch";
import type { ScrapeRunResult, StudyKoreaSource } from "./types";

export type RawStudyKoreaItem = RoutedRawItem & {
  category?: string;
  university?: string;
};

/** @deprecated use RoutedRawItem */
export type { RoutedRawItem };

export async function processAndSaveItems(
  runSource: string,
  source: StudyKoreaSource,
  items: RawStudyKoreaItem[],
  query = ""
): Promise<ScrapeRunResult> {
  return runRoutedBatch(runSource, source, items, query);
}
