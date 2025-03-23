import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { QuillModule } from 'ngx-quill';
import { PrayerService } from '../../services/prayer.service';
import { TagService } from '../../services/tag.service';
import { PrayerRequest } from '../../models/prayer-request';
import { Tag } from '../../models/tag';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-prayer-request',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    QuillModule
  ],
  templateUrl: './prayer-request.component.html',
  styleUrls: ['./prayer-request.component.scss']
})
export class PrayerRequestComponent implements OnInit, OnDestroy {
  requestForm: FormGroup;
  request: PrayerRequest | null = null;
  tags: Tag[] = [];
  filteredTags: Tag[] = [];
  loading = false;
  saving = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private prayerService: PrayerService,
    private tagService: TagService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.requestForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      tags: [[]],
      isForMe: [false]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.loadRequest(parseInt(id, 10));
    }
    this.loadTags();
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
          this.requestForm.patchValue({
            title: request.title,
            description: request.description,
            tags: request.tags,
            isForMe: request.isForMe
          });
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading prayer request:', error);
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

  filterTags(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.toLowerCase();
    this.filteredTags = this.tags.filter(tag => 
      tag.name.toLowerCase().includes(value) &&
      !this.requestForm.get('tags')?.value.some((t: Tag) => t.id === tag.id)
    );
  }

  addTag(tag: Tag): void {
    const tags = this.requestForm.get('tags')?.value || [];
    if (!tags.some((t: Tag) => t.id === tag.id)) {
      this.requestForm.patchValue({
        tags: [...tags, tag]
      });
    }
  }

  removeTag(tag: Tag): void {
    const tags = this.requestForm.get('tags')?.value || [];
    this.requestForm.patchValue({
      tags: tags.filter((t: Tag) => t.id !== tag.id)
    });
  }

  saveRequest(): void {
    if (!this.requestForm.valid) return;

    this.saving = true;
    const formValue = this.requestForm.value;
    const requestData: PrayerRequest = {
      id: this.request?.id || 0,
      title: formValue.title,
      description: formValue.description,
      tags: formValue.tags,
      isForMe: formValue.isForMe,
      createdAt: this.request?.createdAt || new Date().toISOString(),
      updates: this.request?.updates || []
    };

    const operation = this.request && typeof this.request.id === 'number'
      ? this.prayerService.updateRequest(this.request.id, requestData)
      : this.prayerService.createRequest(requestData);

    operation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (savedRequest) => {
          this.request = savedRequest;
          this.saving = false;
          this.router.navigate(['/prayer-requests']);
        },
        error: (error) => {
          console.error('Error saving prayer request:', error);
          this.saving = false;
        }
      });
  }
} 