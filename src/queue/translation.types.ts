// Shared contract with crewclaro-translator (app/schemas.py). Keep in sync.

/** Pushed to Redis list `translation:jobs` */
export interface TranslationJob {
  messageId: string;
  text: string;
  sourceLang: string;
  targetLangs: string[];
}

/** Published by the translator on Redis channel `translation:done` */
export interface TranslationResult {
  messageId: string;
  translations: Record<string, string>;
  status: "done" | "failed";
  error?: string;
}
