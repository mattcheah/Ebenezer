import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { JournalService } from '../../services/journal.service';
import { TagService } from '../../services/tag.service';
import { PrayerService } from '../../services/prayer.service';
import { JournalEntry } from '../../models/journal-entry';
import { Tag } from '../../models/tag';
import { PrayerRequest } from '../../models/prayer-request';
import { debounceTime, distinctUntilChanged, map, takeUntil, takeWhile } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MarkdownModule, MarkdownService } from 'ngx-markdown';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { AssignPersonDialogComponent } from '../assign-person-dialog/assign-person-dialog.component';
import { Person } from '../../models/person';

@Component({
  selector: 'app-journal-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MarkdownModule,
    SafeHtmlPipe,
    AssignPersonDialogComponent
  ],
  providers: [MarkdownService],
  templateUrl: './journal-entry.component.html',
  styleUrls: ['./journal-entry.component.scss']
})
export class JournalEntryComponent implements OnInit, OnDestroy {
  @ViewChild('contentTextarea') contentTextarea!: ElementRef;
  
  entryForm: FormGroup = new FormGroup({});
  entry: JournalEntry | null = null;
  tags: Tag[] = [];
  prayerRequests: PrayerRequest[] = [];
  filteredTags: Tag[] = [];
  filteredPrayerRequests: PrayerRequest[] = [];
  loading = false;
  saving = false;
  private destroy$ = new Subject<void>();
  people: Person[] = [];

  initDate = new Date();

  constructor(
    private fb: FormBuilder,
    private journalService: JournalService,
    private tagService: TagService,
    private prayerService: PrayerService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {

  }

  ngOnInit(): void {
    this.loading = true;
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEntry(parseInt(id, 10));
    } else {
      this.entryForm = this.fb.group({
        title: [
          this.initDate.toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }).replace('at', '-').replace(' PM', 'pm').replace(' AM', 'am'),
          Validators.required],
        date: [this.initDate, Validators.required],
        tags: [[]],
        bibleVerses: [[]],
        prayerRequests: this.fb.array([]),
        content: ['', Validators.required]
      });
      this.loading = false;
    }

    
    // this.loadTags();
    // this.loadPrayerRequests();
    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  onTitleBlur(): void {
    let title = this.entryForm.get('title');
    if (title?.value == "") {
      this.entryForm.patchValue({
        title: this.initDate.toLocaleString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).replace('at', '-').replace(' PM', 'pm').replace(' AM', 'am')
      });
      title.markAsPristine();
    }
    
  }

  private loadEntry(id: number): void {
    this.loading = true;
    this.journalService.getEntry(id).subscribe({
      next: (entry) => {
        this.entry = entry;
        const prayerRequestsArray = this.fb.array(
          (entry.prayerRequests || []).map((request: PrayerRequest) => 
            this.fb.group({
              title: [request.title || '', Validators.required],
              description: [request.description || ''],
              checked: [request.checked || false],
              assignedPerson: [request.assignedPerson || null],
              isForMe: [request.isForMe || false],
              tags: [request.tags || []],
              updates: [request.updates || []],
              id: [request.id]
            })
          )
        );

        this.entryForm = this.fb.group({
          title: entry.title,
          date: new Date(entry.createdAt ?? this.initDate),
          tags: entry.tags,
          bibleVerses: entry.bibleVerses,
          prayerRequests: prayerRequestsArray,
          content: entry.content
        });

        // Add any new people from prayer requests to the people list
        entry.prayerRequests?.forEach(request => {
          if (request.assignedPerson && !this.people.find(p => p.id === request.assignedPerson?.id)) {
            this.people.push(request.assignedPerson);
          }
        });

        this.loading = false;
      },
      error: (error: Error) => {
        console.error('Error loading entry:', error);
        this.loading = false;
      }
    });
  }

  // private loadTags(): void {
  //   this.tagService.getTags().subscribe({
  //     next: (tags: Tag[]) => {
  //       this.tags = tags;
  //     },
  //     error: (error: Error) => {
  //       console.error('Error loading tags:', error);
  //     }
  //   });
  // }

  // private loadPrayerRequests(): void {
  //   this.prayerService.getRequests().subscribe({
  //     next: (requests: PrayerRequest[]) => {
  //       this.prayerRequests = requests;
  //     },
  //     error: (error: Error) => {
  //       console.error('Error loading prayer requests:', error);
  //     }
  //   });
  // }

  private setupAutoSave(): void {
    this.entryForm.valueChanges
      .pipe(
        debounceTime(10000),
        distinctUntilChanged(),
        map(() => this.entryForm.valid)
      )
      .subscribe((isValid) => {
        if (isValid && this.entryForm.dirty) {
          this.saveEntry();
        }
      });
  }

  

  insertMarkdown(prefix: string, suffix: string = ''): void {
    const textarea = this.contentTextarea.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = this.entryForm.get('content')?.value || '';
    const selectedText = text.substring(start, end);

    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    this.entryForm.patchValue({ content: newText });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    });
  }

  filterTags(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.toLowerCase();
    this.filteredTags = this.tags.filter(tag => 
      tag.name.toLowerCase().includes(value) &&
      !this.entryForm.get('tags')?.value.some((t: Tag) => t.id === tag.id)
    );
  }

  filterPrayerRequests(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.toLowerCase();
    this.filteredPrayerRequests = this.prayerRequests.filter(request =>
      request.title.toLowerCase().includes(value) &&
      !this.entryForm.get('prayerRequests')?.value.includes(request.id)
    );
  }

  addTag(tag: Tag): void {
    const tags = this.entryForm.get('tags')?.value || [];
    if (!tags.some((t: Tag) => t.id === tag.id)) {
      this.entryForm.patchValue({
        tags: [...tags, tag]
      });
    }
  }

  removeTag(tag: Tag): void {
    const tags = this.entryForm.get('tags')?.value || [];
    this.entryForm.patchValue({
      tags: tags.filter((t: Tag) => t.id !== tag.id)
    });
  }

  addBibleVerse(verse: string): void {
    const verses = this.entryForm.get('bibleVerses')?.value || [];
    if (verse && !verses.includes(verse)) {
      this.entryForm.patchValue({
        bibleVerses: [...verses, verse]
      });
    }
  }

  removeBibleVerse(verse: string): void {
    const verses = this.entryForm.get('bibleVerses')?.value || [];
    this.entryForm.patchValue({
      bibleVerses: verses.filter((v: string) => v !== verse)
    });
  }

  get prayerRequestsFormArray() {
    return this.entryForm.get('prayerRequests') as FormArray;
  }

  addPrayerRequestForm(): void {
    const prayerRequestForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      checked: [false],
      assignedPerson: [null],
      isForMe: [false],
      tags: [[]],
      updates: [[]],
      id: [null]
    });
    this.prayerRequestsFormArray.push(prayerRequestForm);
  }

  adjustTextareaHeight(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  togglePrayerRequestCheck(index: number): void {
    const formGroup = this.prayerRequestsFormArray.at(index);
    const currentValue = formGroup.get('checked')?.value;
    formGroup.patchValue({ checked: !currentValue });
  }

  removePrayerRequestForm(index: number): void {
    if (this.prayerRequestsFormArray.length > 0) {
      this.prayerRequestsFormArray.removeAt(index);
    }
  }

  getPrayerRequestById(id: number): PrayerRequest | undefined {
    return this.prayerRequests.find(request => request.id === id);
  }

  saveEntry(): void {
    if (!this.entryForm.valid) return;

    this.saving = true;
    const formValue = this.entryForm.value;
    console.log('Form value:', formValue); // Debug log

    const entryData: JournalEntry = {
      id: this.entry?.id,
      title: formValue.title,
      content: formValue.content,
      tags: formValue.tags || [],
      bibleVerses: formValue.bibleVerses || [],
      prayerRequests: (formValue.prayerRequests || []).map((request: any) => ({
        id: request.id || undefined,
        title: request.title,
        description: request.description || '',
        checked: request.checked || false,
        assignedPerson: request.assignedPerson || null,
        isForMe: request.isForMe || false,
        tags: request.tags || [],
        updates: request.updates || []
      })),
      createdAt: this.entry?.createdAt,
      updatedAt: new Date().toISOString()
    };

    console.log('Entry data being sent:', entryData); // Debug log

    const operation = this.entry?.id
      ? this.journalService.updateEntry(this.entry.id, entryData)
      : this.journalService.createEntry(entryData);

    operation.subscribe({
      next: (savedEntry) => {
        this.entry = savedEntry;
        this.saving = false;
        this.entryForm.markAsPristine();
      },
      error: (error) => {
        console.error('Error saving entry:', error);
        this.saving = false;
      }
    });
  }

  openAssignPersonDialog(index: number): void {
    const prayerRequest = this.prayerRequestsFormArray.at(index);
    const currentPerson = prayerRequest.get('assignedPerson')?.value;

    const dialogRef = this.dialog.open(AssignPersonDialogComponent, {
      data: {
        people: this.people,
        currentPerson: currentPerson
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (!this.people.find(p => p.id === result.id)) {
          this.people.push(result);
        }
        prayerRequest.patchValue({ assignedPerson: result });
      }
    });
  }
}
