import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../../core/services/auth.service';
import { NotifyService } from '../../../../core/services/notify.service';

import { AuthArtComponent } from '../../../../shared/components/auth-art.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    AuthArtComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  notice: string | null = null;
  private returnUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private notify: NotifyService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.returnUrl = params.get('returnUrl');

    const email = params.get('email');
    if (email) {
      this.loginForm.patchValue({ email });
    }

    if (params.get('expired')) {
      this.notice = 'Your session has expired. Please sign in again.';
    } else if (params.get('registered')) {
      this.notice = 'Account created. Sign in to get started.';
    } else if (params.get('error') === 'google') {
      this.notice = 'Google sign-in did not complete. Please try again.';
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login({ email: String(email).trim().toLowerCase(), password }).subscribe({
      next: () => {
        this.isLoading = false;
        this.notify.success(`Welcome back, ${this.authService.currentUser()?.name ?? ''}!`.replace(', !', '!'));
        this.authService.redirectAfterLogin(this.returnUrl);
      },
      error: (error) => {
        this.isLoading = false;
        this.notify.error(error, 'Login failed. Please check your credentials.');
      }
    });
  }

  loginWithGoogle(): void {
    this.isLoading = true;
    this.authService.googleLogin();
  }
}
