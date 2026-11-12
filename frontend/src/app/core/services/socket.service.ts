import { Injectable, computed, effect, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export type NotificationType = 'claimCreated' | 'foodExpiring' | 'pickupReminder' | 'foodClaimed';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  data?: unknown;
  timestamp: Date;
  read: boolean;
}

const MAX_NOTIFICATIONS = 20;

/**
 * Real-time notifications over Socket.IO. Connects whenever a user is signed in
 * and disconnects on sign-out. Notifications are kept per user in localStorage
 * so they survive a reload.
 */
@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private connectedUserId: string | null = null;
  private notificationSubject = new Subject<Notification>();

  readonly notifications$ = this.notificationSubject.asObservable();
  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = computed(() => this.notifications().filter(n => !n.read).length);
  readonly connected = signal(false);

  constructor(private authService: AuthService) {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.connect(user._id);
      } else {
        this.disconnect();
      }
    }, { allowSignalWrites: true });
  }

  connect(userId: string): void {
    if (this.socket && this.connectedUserId === userId) {
      return;
    }
    this.disconnect();

    this.connectedUserId = userId;
    this.notifications.set(this.load(userId));

    this.socket = io(environment.socketUrl, {
      auth: { userId },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => this.connected.set(true));
    this.socket.on('disconnect', () => this.connected.set(false));
    this.socket.on('connect_error', () => this.connected.set(false));

    this.socket.on('claimCreated', (data: { foodTitle?: string } | undefined) => {
      // The backend broadcasts every claim; only donors and admins care.
      const role = this.authService.getRole();
      if (role !== 'donor' && role !== 'admin') return;
      this.push('claimCreated', data?.foodTitle
        ? `New claim on your listing: ${data.foodTitle}`
        : 'A receiver just claimed a food listing', data);
    });

    this.socket.on('foodClaimed', (data: { title?: string } | undefined) => {
      this.push('foodClaimed', `Food claimed: ${data?.title ?? 'a listing'}`, data);
    });

    this.socket.on('foodExpiring', (data: { title?: string } | undefined) => {
      this.push('foodExpiring', `Food expiring soon: ${data?.title ?? 'a listing'}`, data);
    });

    this.socket.on('pickupReminder', (data: { message?: string } | undefined) => {
      this.push('pickupReminder', `Pickup reminder: ${data?.message ?? 'you have a pending pickup'}`, data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectedUserId = null;
    this.connected.set(false);
    this.notifications.set([]);
  }

  emit(event: string, data: unknown): void {
    this.socket?.emit(event, data);
  }

  markAllRead(): void {
    this.update(list => list.map(n => ({ ...n, read: true })));
  }

  markRead(id: string): void {
    this.update(list => list.map(n => (n.id === id ? { ...n, read: true } : n)));
  }

  clearAll(): void {
    this.update(() => []);
  }

  private push(type: NotificationType, message: string, data?: unknown): void {
    const notification: Notification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      message,
      data,
      timestamp: new Date(),
      read: false
    };
    this.update(list => [notification, ...list].slice(0, MAX_NOTIFICATIONS));
    this.notificationSubject.next(notification);
  }

  private update(fn: (list: Notification[]) => Notification[]): void {
    const next = fn(this.notifications());
    this.notifications.set(next);
    if (this.connectedUserId) {
      try {
        localStorage.setItem(this.key(this.connectedUserId), JSON.stringify(next));
      } catch { /* ignore */ }
    }
  }

  private load(userId: string): Notification[] {
    try {
      const raw = localStorage.getItem(this.key(userId));
      const list = raw ? (JSON.parse(raw) as Notification[]) : [];
      return list.map(n => ({ ...n, timestamp: new Date(n.timestamp) }));
    } catch {
      return [];
    }
  }

  private key(userId: string): string {
    return `zp_notifications_${userId}`;
  }
}
