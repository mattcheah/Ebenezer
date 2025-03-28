import { Tag } from './tag';
import { Person } from './person';
import { PrayerRequest } from './prayer-request';

export interface JournalEntry {
  id?: number;
  title: string;
  content: string;
  // date: string;
  tags: Tag[];
  bibleVerses: string[];
  prayerRequests: PrayerRequest[];
  createdAt?: string;
  updatedAt?: string;
}
