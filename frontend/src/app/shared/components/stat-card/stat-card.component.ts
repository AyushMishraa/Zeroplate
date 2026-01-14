import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

// Make Math available in template
declare var Math: any;

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.scss']
})
export class StatCardComponent {
  @Input() value: string | number = '';
  @Input() label: string = '';
  @Input() icon: string = '';
  @Input() color: 'donor' | 'receiver' | 'volunteer' | 'admin' | 'default' = 'default';
  @Input() trend?: number; // Percentage change
  
  Math = Math; // Expose Math for template
}

