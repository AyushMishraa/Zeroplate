import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.scss']
})
export class BadgeComponent {
  @Input() label: string = '';
  @Input() type: 'donor' | 'receiver' | 'volunteer' | 'admin' | 'default' = 'default';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
}

