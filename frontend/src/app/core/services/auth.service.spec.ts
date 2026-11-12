import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let router: Router;

  const user = { _id: 'u1', name: 'Asha', email: 'asha@example.com', role: 'donor' as const, provider: 'local' as const };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
  });

  afterEach(() => http.verify());

  it('stores the session after login', () => {
    service.login({ email: user.email, password: 'secret' }).subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush({ message: 'ok', user: { ...user, token: 'abc.def.ghi' } });

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getRole()).toBe('donor');
    expect(service.getToken()).toBe('abc.def.ghi');
    expect(JSON.parse(localStorage.getItem('zp_user') as string).token).toBeUndefined();
  });

  it('accepts a Google session without a token and sends new users to role selection', () => {
    service.handleGoogleCallback({ ...user, provider: 'google', role: 'receiver', isNewUser: true });

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getToken()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/select-role']);
  });

  it('sends userId and role when updating the role', () => {
    service.handleGoogleCallback({ ...user, provider: 'google', role: 'receiver' });
    service.updateRole('donor').subscribe();

    const req = http.expectOne(`${environment.apiUrl}/auth/update-role`);
    expect(req.request.body).toEqual({ userId: 'u1', role: 'donor' });
    req.flush({ message: 'ok', user: { ...user, role: 'donor' } });

    expect(service.getRole()).toBe('donor');
  });

  it('maps roles to their dashboards', () => {
    expect(service.homeRouteFor('donor')).toBe('/donor/dashboard');
    expect(service.homeRouteFor('receiver')).toBe('/receiver/dashboard');
    expect(service.homeRouteFor('admin')).toBe('/admin/dashboard');
    expect(service.homeRouteFor(null)).toBe('/');
  });

  it('clears the session on logout', () => {
    service.handleGoogleCallback({ ...user });
    service.logout();
    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('zp_user')).toBeNull();
  });
});
