import { Tag } from './tag';

export interface JournalEntry {
  id?: number;
  title: string;
  content: string;
  date: string;
  tags: Tag[];
  bibleVerses: string[];
  prayerRequests: number[];
  createdAt?: string;
  updatedAt?: string;
}
