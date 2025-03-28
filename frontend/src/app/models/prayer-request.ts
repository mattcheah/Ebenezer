import { Tag } from './tag';
import { Person } from './person';

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
  checked: boolean;
  assignedPerson: Person | null;
  tags: Tag[];
  updates: PrayerRequestUpdate[];
  createdAt?: string;
  updatedAt?: string;
}
