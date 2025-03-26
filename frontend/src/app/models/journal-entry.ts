import { Tag } from './tag';

export interface JournalEntry {
  id?: number;
  title: string;
  content: string;
  // date: string;
  tags: Tag[];
  bibleVerses: string[];
  prayerRequests: number[];
  created_at?: string;
  updated_at?: string;
}
