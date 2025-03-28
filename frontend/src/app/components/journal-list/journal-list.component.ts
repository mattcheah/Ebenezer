import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { JournalService } from '../../services/journal.service';
import { JournalEntry } from '../../models/journal-entry';
import { format } from 'date-fns';

@Component({
  selector: 'app-journal-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatListModule
  ],
  templateUrl: './journal-list.component.html',
  styleUrl: './journal-list.component.scss'
})
export class JournalListComponent implements OnInit {
  entries: JournalEntry[] = [];
  loading = true;

  constructor(private journalService: JournalService) {}

  ngOnInit(): void {
    this.loadEntries();
  }

  loadEntries(): void {
    this.journalService.getEntries().subscribe({
      next: (entries) => {
        this.entries = entries;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading entries:', error);
        this.loading = false;
      }
    });
  }

  getContentPreview(content: string): string {
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  }
}
