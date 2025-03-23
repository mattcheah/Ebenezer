import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { PrayerService } from '../../services/prayer.service';
import { TagService } from '../../services/tag.service';
import { PrayerRequest } from '../../models/prayer-request';
import { Tag } from '../../models/tag';
import { PrayerRequestUpdate } from '../../models/prayer-request-update';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { format } from 'date-fns';

@Component({
  selector: 'app-prayer-requests',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './prayer-requests.component.html',
  styleUrls: ['./prayer-requests.component.scss']
})
export class PrayerRequestsComponent implements OnInit, OnDestroy {
  prayerRequests: PrayerRequest[] = [];
  tags: Tag[] = [];
  loading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private prayerService: PrayerService,
    private tagService: TagService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPrayerRequests();
    this.loadTags();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPrayerRequests(): void {
    this.prayerService.getRequests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (requests) => {
          this.prayerRequests = requests;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading prayer requests:', error);
          this.loading = false;
        }
      });
  }

  private loadTags(): void {
    this.tagService.getTags()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tags) => {
          this.tags = tags;
        },
        error: (error) => {
          console.error('Error loading tags:', error);
        }
      });
  }

  formatDate(date: string | undefined): string {
    if (!date) return '';
    return format(new Date(date), 'MMM d, yyyy');
  }

  getTagById(id: number): Tag | undefined {
    return this.tags.find(tag => tag.id === id);
  }

  getLatestUpdate(updates: PrayerRequestUpdate[]): PrayerRequestUpdate | undefined {
    return updates.length > 0 ? updates[updates.length - 1] : undefined;
  }

  createNewRequest(): void {
    this.router.navigate(['/prayer-requests/new']);
  }

  editRequest(request: PrayerRequest): void {
    this.router.navigate(['/prayer-requests', request.id, 'edit']);
  }

  deleteRequest(request: PrayerRequest): void {
    if (confirm('Are you sure you want to delete this prayer request?') && typeof request.id === 'number') {
      this.prayerService.deleteRequest(request.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.prayerRequests = this.prayerRequests.filter(r => r.id !== request.id);
          },
          error: (error) => {
            console.error('Error deleting prayer request:', error);
          }
        });
    }
  }
}