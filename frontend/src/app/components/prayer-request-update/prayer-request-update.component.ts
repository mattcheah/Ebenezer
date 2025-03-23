import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { QuillModule } from 'ngx-quill';
import { PrayerService } from '../../services/prayer.service';
import { PrayerRequest } from '../../models/prayer-request';
import { PrayerRequestUpdate } from '../../models/prayer-request-update';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-prayer-request-update',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    QuillModule
  ],
  templateUrl: './prayer-request-update.component.html',
  styleUrls: ['./prayer-request-update.component.scss']
})
export class PrayerRequestUpdateComponent implements OnInit, OnDestroy {
  updateForm: FormGroup;
  request: PrayerRequest | null = null;
  loading = false;
  saving = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private prayerService: PrayerService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.updateForm = this.fb.group({
      content: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const requestId = this.route.snapshot.paramMap.get('requestId');
    if (requestId) {
      this.loadRequest(parseInt(requestId, 10));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRequest(id: number): void {
    this.loading = true;
    this.prayerService.getRequest(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (request) => {
          this.request = request;
          this.loading = false;
        },
        error: (error: Error) => {
          console.error('Error loading prayer request:', error);
          this.loading = false;
        }
      });
  }

  saveUpdate(): void {
    if (!this.updateForm.valid || !this.request || typeof this.request.id !== 'number') return;

    this.saving = true;
    const formValue = this.updateForm.value;
    const updateData: PrayerRequestUpdate = {
      id: 0, // Will be assigned by the backend
      prayerRequestId: this.request.id,
      date: new Date().toISOString(),
      content: formValue.content
    };

    this.prayerService.createRequestUpdate(this.request.id, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (savedUpdate: PrayerRequestUpdate) => {
          if (this.request) {
            this.request.updates.push(savedUpdate);
            this.router.navigate(['/prayer-requests', this.request.id]);
          }
          this.saving = false;
        },
        error: (error: Error) => {
          console.error('Error saving update:', error);
          this.saving = false;
        }
      });
  }
} 