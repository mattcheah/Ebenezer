import { Tag } from './tag';

export interface PrayerRequestUpdate {
  id?: number;
  content: string;
  date: string;
  createdAt?: string;
}

export interface PrayerRequest {
  id?: number;
  title: string;
  description: string;
  isForMe: boolean;
  tags: Tag[];
  updates: PrayerRequestUpdate[];
  createdAt?: string;
  updatedAt?: string;
}
