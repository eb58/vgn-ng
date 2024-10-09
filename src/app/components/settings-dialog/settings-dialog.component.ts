import { Component, Inject } from '@angular/core';
import { QuestionDialogComponent } from '../question-dialog/question-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface SettingsDialogData {
  whoBegins: 'human' | 'ai';
  maxLev: number;
}
@Component({
  selector: 'app-settings-dialog',
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.css']
})
export class SettingsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<QuestionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SettingsDialogData,
  ) { }

  onCancel(): void {
    this.dialogRef.close();
  }
}
