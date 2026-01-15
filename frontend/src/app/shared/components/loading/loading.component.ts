import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent {
  @Input() message: string = 'Loading...';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  
  getSpinnerSize(): number {
    switch (this.size) {
      case 'small': return 40;
      case 'large': return 80;
      default: return 60;
    }
  }
}

