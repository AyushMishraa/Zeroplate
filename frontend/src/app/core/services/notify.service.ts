import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

/** Thin wrapper over MatSnackBar so pages show consistent messages. */
@Injectable({
  providedIn: 'root'
})
export class NotifyService {
  constructor(private snackBar: MatSnackBar) {}

  success(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000, panelClass: 'snack-success' });
  }

  info(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  error(error: unknown, fallback = 'Something went wrong. Please try again.'): void {
    this.snackBar.open(NotifyService.messageFrom(error, fallback), 'Close', { duration: 5000, panelClass: 'snack-error' });
  }

  static messageFrom(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'Cannot reach the server. Is the backend running?';
      const body = error.error as { message?: string; error?: string } | string | null;
      if (typeof body === 'string' && body.trim()) return body;
      if (body && typeof body === 'object' && body.message) return body.message;
    }
    return fallback;
  }
}
