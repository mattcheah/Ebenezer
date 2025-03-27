import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Person } from '../../models/person';

@Component({
  selector: 'app-assign-person-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Assign Prayer Request</h2>
    <mat-dialog-content>
      <form [formGroup]="assignForm" class="assign-form">
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Select Person</mat-label>
          <mat-select formControlName="selectedPerson">
            <mat-option [value]="null">None</mat-option>
            <mat-option *ngFor="let person of people" [value]="person">
              {{ person.firstName }} {{ person.lastName }}
            </mat-option>
            <mat-option [value]="'new'">+ Add New Person</mat-option>
          </mat-select>
        </mat-form-field>

        <ng-container *ngIf="showNewPersonForm">
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>First Name</mat-label>
            <input matInput formControlName="firstName" placeholder="Enter first name">
          </mat-form-field>

          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName" placeholder="Enter last name">
          </mat-form-field>
        </ng-container>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" 
              [disabled]="!isFormValid()" 
              (click)="onSubmit()">
        Assign
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .assign-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 300px;
    }
    .full-width {
      width: 100%;
    }
  `]
})
export class AssignPersonDialogComponent {
  assignForm: FormGroup;
  people: Person[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AssignPersonDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { people: Person[], currentPerson: Person | null }
  ) {
    this.people = data.people;
    this.assignForm = this.fb.group({
      selectedPerson: [data.currentPerson],
      firstName: [''],
      lastName: ['']
    });

    this.assignForm.get('selectedPerson')?.valueChanges.subscribe(value => {
      if (value === 'new') {
        this.assignForm.get('firstName')?.setValidators([Validators.required]);
        this.assignForm.get('lastName')?.setValidators([Validators.required]);
      } else {
        this.assignForm.get('firstName')?.clearValidators();
        this.assignForm.get('lastName')?.clearValidators();
      }
      this.assignForm.get('firstName')?.updateValueAndValidity();
      this.assignForm.get('lastName')?.updateValueAndValidity();
    });
  }

  get showNewPersonForm(): boolean {
    return this.assignForm.get('selectedPerson')?.value === 'new';
  }

  isFormValid(): boolean {
    if (this.showNewPersonForm) {
      const firstName = this.assignForm.get('firstName');
      const lastName = this.assignForm.get('lastName');
      return firstName?.valid === true && lastName?.valid === true;
    }
    return true;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.showNewPersonForm) {
      const firstName = this.assignForm.get('firstName')?.value;
      const lastName = this.assignForm.get('lastName')?.value;
      if (firstName && lastName) {
        const newPerson: Person = {
          id: Date.now(),
          firstName,
          lastName
        };
        this.dialogRef.close(newPerson);
      }
    } else {
      const selectedPerson = this.assignForm.get('selectedPerson')?.value;
      this.dialogRef.close(selectedPerson);
    }
  }
} 