import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

export interface Notification {
  type: 'claimCreated' | 'foodExpiring' | 'pickupReminder' | 'foodClaimed';
  message: string;
  data?: any;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private notificationSubject = new Subject<Notification>();
  
  notifications$ = this.notificationSubject.asObservable();

  connect(userId: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(environment.socketUrl, {
      auth: { userId },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('claimCreated', (data: any) => {
      this.notificationSubject.next({
        type: 'claimCreated',
        message: `New claim created for your food: ${data.foodTitle}`,
        data,
        timestamp: new Date()
      });
    });

    this.socket.on('foodExpiring', (data: any) => {
      this.notificationSubject.next({
        type: 'foodExpiring',
        message: `Food expiring soon: ${data.title}`,
        data,
        timestamp: new Date()
      });
    });

    this.socket.on('pickupReminder', (data: any) => {
      this.notificationSubject.next({
        type: 'pickupReminder',
        message: `Pickup reminder: ${data.message}`,
        data,
        timestamp: new Date()
      });
    });

    this.socket.on('foodClaimed', (data: any) => {
      this.notificationSubject.next({
        type: 'foodClaimed',
        message: `Your food donation "${data.foodTitle}" has been claimed`,
        data,
        timestamp: new Date()
      });
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}
