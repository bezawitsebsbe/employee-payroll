import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { Observable, Subject, takeUntil } from 'rxjs';
import { map } from 'rxjs/operators';
import { PayrollFirebaseFacade } from '../../facade/payroll.facade';

export interface PayrollStatistics {
  totalPayroll: number;
  totalPayrollChange: string;
  totalBonuses: number;
  totalBonusesChange: string;
  deductions: number;
  deductionsChange: string;
  employees: number;
  employeesChange: string;
}

@Component({
  selector: 'app-payroll-statistics-cards',
  standalone: true,
  imports: [CommonModule, NzGridModule, NzIconModule, NzTypographyModule],
  templateUrl: './payroll-statistics-cards.component.html',
  styleUrls: ['./payroll-statistics-cards.component.scss']
})
export class PayrollStatisticsCardsComponent implements OnInit, OnDestroy {
  statistics$: Observable<PayrollStatistics> = new Observable();
  loading$: Observable<boolean> = new Observable();
  
  private destroy$ = new Subject<void>();

  constructor(private readonly payrollFacade: PayrollFirebaseFacade) {}

  ngOnInit(): void {
    this.initializeStatistics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeStatistics(): void {
    // Get statistics from Firebase facade
    this.statistics$ = this.payrollFacade.statistics$.pipe(
      map(stats => ({
        totalPayroll: stats.totalPayroll,
        totalPayrollChange: this.calculateChange(stats.totalPayroll, 0), // You can implement change calculation
        totalBonuses: stats.totalBonuses,
        totalBonusesChange: this.calculateChange(stats.totalBonuses, 0),
        deductions: stats.totalDeductions,
        deductionsChange: this.calculateDeductionsChange(stats.totalDeductions, 0),
        employees: stats.totalEmployees,
        employeesChange: this.calculateChange(stats.totalEmployees, 0)
      }))
    );

    this.loading$ = this.payrollFacade.loading$;
  }

  private calculateChange(current: number, previous: number): string {
    if (previous === 0) {
      return current > 0 ? `+${current}` : '0';
    }
    
    const change = ((current - previous) / previous) * 100;
    return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  }

  private calculateDeductionsChange(current: number, previous: number): string {
    if (previous === 0) {
      return current > 0 ? `-${current}` : '0';
    }
    
    const change = ((current - previous) / previous) * 100;
    return change >= 0 ? `-${change.toFixed(1)}%` : `${Math.abs(change).toFixed(1)}%`;
  }
}
