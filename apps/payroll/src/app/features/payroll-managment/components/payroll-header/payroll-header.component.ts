import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'app-payroll-header',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzIconModule, NzTypographyModule],
  templateUrl: './payroll-header.component.html',
  styleUrls: ['./payroll-header.component.scss']
})
export class PayrollHeaderComponent {
  @Output() exportClick = new EventEmitter<void>();
  @Output() addPayrollClick = new EventEmitter<void>();
}
