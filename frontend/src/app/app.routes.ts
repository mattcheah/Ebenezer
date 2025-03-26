import { Routes } from '@angular/router';
import { JournalListComponent } from './components/journal-list/journal-list.component';
import { JournalEntryComponent } from './components/journal-entry/journal-entry.component';
import { PrayerRequestsComponent } from './components/prayer-requests/prayer-requests.component';
import { PrayersForMeComponent } from './components/prayers-for-me/prayers-for-me.component';

export const routes: Routes = [
  { path: '', component: JournalListComponent },
  // { path: 'journal', component: JournalListComponent },
  { path: 'journal/new', component: JournalEntryComponent },
  { path: 'journal/:id', component: JournalEntryComponent },
  { path: 'prayer-requests', component: PrayerRequestsComponent },
  { path: 'prayers-for-me', component: PrayersForMeComponent },
];
