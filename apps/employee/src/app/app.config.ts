// app.config.ts
import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { provideNzI18n, en_US } from 'ng-zorro-antd/i18n';
import {
  DollarOutline,
  TeamOutline,
  LineChartOutline,
  ClockCircleOutline,
  HistoryOutline,
  DownloadOutline,
  PlusOutline,
  FormOutline,
  ApartmentOutline,
  BankOutline,
} from '@ant-design/icons-angular/icons';

import {
  EditOutline,
  DeleteOutline,
  MailOutline,
  PhoneOutline,
} from '@ant-design/icons-angular/icons';

import {
  ClearOutline,
  ArrowUpOutline,
  FileTextOutline,
  MinusOutline,
  UserOutline,
} from '@ant-design/icons-angular/icons';

import {
  SyncOutline,
  DeleteOutline as DeleteOutlineIcon,
  SettingOutline,
} from '@ant-design/icons-angular/icons';

import { provideStore } from '@ngxs/store';
import { AuthState } from '../../../../libs/core/auth/src/lib/store/state/auth.state';
import { AuthApiService } from '../../../../libs/core/auth/src/lib/api/auth.service';
import { DashboardState } from '../../../../libs/features/dashboard/src/lib/store/state/dashboard.state';
import { EmployeeState } from './features/employee/store/state/employee.state';
import { AttendanceState } from './features/attendance/store/state/attendance.state';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(),

    provideAnimations(), // or provideNoopAnimations() if you don't need real animations

    provideStore([AuthState, DashboardState, EmployeeState, AttendanceState]),
    
    // ✅ ADD AuthApiService to providers
    AuthApiService,

    // ✅ ADD English i18n for ng-zorro
    provideNzI18n(en_US),

    provideNzIcons([
      DollarOutline,
      TeamOutline,
      LineChartOutline,
      ClockCircleOutline,
      HistoryOutline,
      EditOutline,
      DeleteOutline,
      MailOutline,
      PhoneOutline,
      DownloadOutline,
      PlusOutline,
      FormOutline,
      ApartmentOutline,
      BankOutline,
      ClearOutline,
      ArrowUpOutline,
      FileTextOutline,
      MinusOutline,
      UserOutline,
      SyncOutline,
      DeleteOutlineIcon,
      SettingOutline,
    ]),

  ],
};

console.log('App config initialized with routes:', appRoutes);
