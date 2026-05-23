/**
 * Study Korea pipeline entry — master cron 및 어드민 Run All에서 사용.
 */

import { scrapeNaverNewsStudyKorea } from "./naver-news";
import { scrapeNaverStudyKorea } from "./naver";
import { scrapeRedditStudyKorea } from "./reddit";
import { scrapeUniversitiesIntl } from "./universities-intl";
import { scrapeYoutubeStudyKorea } from "./youtube";
import type { ScrapeRunResult } from "./types";

export type StudyKoreaPipelineSource =
  | "youtube"
  | "reddit"
  | "university_official"
  | "naver_blog"
  | "naver_news";

export const STUDY_KOREA_PIPELINE_SOURCES: StudyKoreaPipelineSource[] = [
  "youtube",
  "reddit",
  "university_official",
  "naver_blog",
  "naver_news",
];

export type PipelineRunner = () => Promise<ScrapeRunResult>;

export const STUDY_KOREA_PIPELINE_RUNNERS: Record<
  StudyKoreaPipelineSource,
  PipelineRunner
> = {
  youtube: scrapeYoutubeStudyKorea,
  reddit: scrapeRedditStudyKorea,
  university_official: scrapeUniversitiesIntl,
  naver_blog: scrapeNaverStudyKorea,
  naver_news: scrapeNaverNewsStudyKorea,
};

export {
  scrapeRedditStudyKorea,
  scrapeRedditSubredditBatch,
  scrapeRedditAllSubreddits,
} from "./reddit";
export { collectRedditRssForSubreddit, getSubredditNames } from "./reddit-rss";
