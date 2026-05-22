import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, TemplateRef, ChangeDetectorRef, ContentChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { Subject, Observable } from 'rxjs';
import { map, startWith, filter } from 'rxjs/operators';

import {
  EntityColumn,
  EntityAction,
  EntitySetting,
  EntityConfig,
  EntityTableData,
  SortEvent,
  PaginationEvent,
  GroupEvent,
  ViewMode
} from '../../models/entity-model';

@Component({
  selector: 'app-entity-table',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzCheckboxModule,
    NzIconModule,
    NzDropDownModule,
    NzTooltipModule,
    NzInputModule,
    NzTagModule,
    NzAvatarModule,
    NzSelectModule
  ],
  templateUrl: './entity-table.component.html',
  styleUrls: ['./entity-table.component.scss']
})
export class EntityTableComponent implements OnInit, OnDestroy {
  @Input() data: EntityTableData = { items: [] };
  @Input() config: EntityConfig = {};
  @Input() setting: EntitySetting = {
  visibleColumns: [],
  primaryColumn: {
    key: 'id',
    name: 'ID',
    label: 'ID',
    type: 'text',
    hideSort: false,
    tdClass: '',
    onChild: false
  },
  favorite: false,  // ✅ Add favorite property
  showFilters: true  // ✅ Changed to true by default
};
  @Input() viewMode: ViewMode = { mode: 'list', label: 'List' };

  @Input() headerAction: EntityAction | null = null;

  @Output() sortChange = new EventEmitter<SortEvent>();
  @Output() currentPageDataChange = new EventEmitter<any[]>();
  @Output() action = new EventEmitter<{ action: string; data: any }>();
  @Output() filtersChange = new EventEmitter<any>();
  @Output() paginationChange = new EventEmitter<PaginationEvent>();
  @Output() groupChange = new EventEmitter<GroupEvent>();
  @Output() checkAllChange = new EventEmitter<boolean>();
  @Output() itemCheckChange = new EventEmitter<{ id: string; checked: boolean }>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();

  @Input() loading = false;

  @ViewChild('row') table: any;

  // Router-related properties
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  
  // Observable for detail panel visibility - shows for detail and add routes
  hasDetail$ = new Observable<boolean>();

  // Form controls
  searchControl = new FormControl('');
  departmentControl = new FormControl('');
  statusControl = new FormControl('');
  selectedGroupControl = new FormControl('');
  selectedFavoriteControl = new FormControl('');

  // View states
  treeView = false;
  searchTerm = '';
  departmentFilter = '';
  statusFilter = '';
  mapOfCheckedId: { [key: string]: boolean } = {};
  isIndeterminate = false;
  allChecked = false;

  // Templates
  @ContentChild('cellTemplate') cellTemplate: TemplateRef<any> | null = null;
  @ContentChild('childViewCellTemplate') childViewCellTemplate: TemplateRef<any> | null = null;

  private destroy$ = new Subject<void>();

  // constructor() {}

  // Helper methods for filter changes
  onGroupChange(value: string | null): void {
    this.groupChange.emit({ group: value || '' });
  }

  onFavoriteChange(value: string | null): void {
    // Handle favorite filter logic
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.departmentFilter = '';
    this.statusFilter = '';
    this.applyFilters();
  }

  // Helper method to get identity key consistently
  getIdentityKey(): string {
    return this.setting?.identity || this.config?.identity || 'id';
  }

  // Public getter for template access
  get idKey(): string {
    return this.getIdentityKey();
  }

  ngOnInit(): void {
    console.log(' EntityTable ngOnInit called');
    console.log(' headerAction input:', this.headerAction);
    console.log(' setting input:', this.setting);
    
    // Initialize hasDetail$ observable
    this.hasDetail$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        const childRoute = this.route.firstChild;
        const hasChild = !!childRoute;
        return hasChild;
      }),
      startWith(false)
    );
    
    this.initializeDefaults();

    this.searchControl.valueChanges.subscribe(value => {
      this.searchTerm = value || '';
      this.applyFilters();
    });

    this.departmentControl.valueChanges.subscribe(value => {
      this.departmentFilter = value || '';
      this.applyFilters();
    });

    this.statusControl.valueChanges.subscribe(value => {
      this.statusFilter = value || '';
      this.applyFilters();
    });

    this.selectedGroupControl.valueChanges.subscribe(value => {
      this.onGroupChange(value);
    });

    this.selectedFavoriteControl.valueChanges.subscribe(value => {
      this.onFavoriteChange(value);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeDefaults(): void {
    this.config = {
      title: this.config.title || 'Entities',
      searchable: this.config.searchable !== false,
      paginated: this.config.paginated !== false,
      pageSize: this.config.pageSize || 10,
      showSizeChanger: this.config.showSizeChanger !== false,
      frontPagination: this.config.frontPagination !== false,
      loading: this.config.loading || false,
      otherView: this.config.otherView || false,
      useClickHandler: this.config.useClickHandler || false,
      detailUrl: this.config.detailUrl || 'detail',
      showDetail: this.config.showDetail || false,
      detailTemplate: this.config.detailTemplate || null,
      actions: this.config.actions || [],  // ✅ Add actions property
      primaryColumn: this.config.primaryColumn || {
        key: 'id',
        name: 'ID',
        label: 'ID',
        type: 'text',
        hideSort: false,
        tdClass: '',
        onChild: false
      }
    };

    this.setting = {
      title: this.setting.title || 'Entities',
      searchable: this.setting.searchable !== false,
      paginated: this.setting.paginated !== false,
      pageSize: this.setting.pageSize || 10,
      showSizeChanger: this.setting.showSizeChanger !== false,
      frontPagination: this.setting.frontPagination !== false,
      loading: this.setting.loading || false,
      otherView: this.setting.otherView || false,
      useClickHandler: this.setting.useClickHandler || false,
      detailUrl: this.setting.detailUrl || 'detail',
      visibleColumns: this.setting.visibleColumns || [],
      showTabs: this.setting.showTabs !== false,  // Preserve showTabs setting
      showFilters: this.setting.showFilters !== false,  // Preserve showFilters setting
      tabType: this.setting.tabType || 'employee',  // Preserve tabType setting
      actions: this.setting.actions || [],  // Preserve actions setting
      primaryColumn: this.setting.primaryColumn || {
        key: 'id',
        name: 'ID',
        label: 'ID',
        type: 'text',
        hideSort: false,
        tdClass: '',
        onChild: false
      }
    };
  }

  private updateConfig(): void {
    console.log(' EntityTable updateConfig called');
    console.log(' this.headerAction before update:', this.headerAction);
    
    this.config = {
      title: this.setting.title || 'Entities',
      searchable: this.setting.searchable !== false,
      paginated: this.setting.paginated !== false,
      pageSize: this.setting.pageSize || 10,
      showSizeChanger: this.setting.showSizeChanger !== false,
      frontPagination: this.setting.frontPagination !== false,
      loading: this.setting.loading || false,
      otherView: this.setting.otherView || false,
      useClickHandler: this.setting.useClickHandler || false,
      detailUrl: this.setting.detailUrl || 'detail',
      visibleColumns: this.setting.visibleColumns || [],
      showTabs: this.setting.showTabs !== false,  // Preserve showTabs setting
      showFilters: this.setting.showFilters !== false,  // Preserve showFilters setting
      tabType: this.setting.tabType || 'employee',  // Preserve tabType setting
      actions: this.setting.actions || [],  // Preserve actions setting
      primaryColumn: this.setting.primaryColumn || {
        key: 'id',
        name: 'ID',
        label: 'ID',
        type: 'text',
        hideSort: false,
        tdClass: '',
        onChild: false
      }
    };
    
    console.log(' this.headerAction after update:', this.headerAction);
    console.log(' config created:', this.config);
  }

  // Table events
  sort(event: Event): void {
    // Extract SortEvent properties from the Event
    const sortEvent = {
      key: (event as any).key || (event as any).columnKey,
      value: (event as any).value
    } as SortEvent;
    this.sortChange.emit(sortEvent);
  }

  onPaginationChange(event: PaginationEvent): void {
    this.paginationChange.emit(event);
  }

  handleCurrentPageDataChange(data: readonly any[]): void {
    this.currentPageDataChange.emit(data as any[]);
  }

  // Checkbox handling
  checkAll(value: boolean): void {
    if (!this.setting) return;
    
    this.data.items.forEach(item => {
      this.mapOfCheckedId[item[this.setting?.identity || 'id']] = value;
    });
    this.refreshStatus();
    this.checkAllChange.emit(value);
  }

  refreshStatus(): void {
    if (!this.setting) return;

    const allChecked = this.data.items.every(item => 
      this.mapOfCheckedId[item[this.setting?.identity || 'id']]
    );
    const allUnChecked = this.data.items.every(item => 
      !this.mapOfCheckedId[item[this.config?.identity || 'id']]
    );
    
    this.allChecked = allChecked;
    this.isIndeterminate = !allChecked && !allUnChecked;
    this.cdr.detectChanges();
  }

  onItemCheckChange(id: string, checked: boolean): void {
    this.mapOfCheckedId[id] = checked;
    this.refreshStatus();
    this.itemCheckChange.emit({ id, checked });
  }

  // Group handling
  onGroup(group: string): void {
    this.groupChange.emit({ group });
  }

  // View mode toggle
  toggleTreeView(): void {
    this.treeView = !this.treeView;
  }

  // Action handling
  onEntityAction(actionKey: string, data: any): void {
    // Find the action configuration
    const action = this.config.actions?.find(a => a.key === actionKey);
    
    // Handle router navigation if routerLink is defined
    if (action?.routerLink) {
      if (typeof action.routerLink === 'string') {
        this.router.navigate([action.routerLink]);
        return;
      } else if (Array.isArray(action.routerLink)) {
        this.router.navigate(action.routerLink);
        return;
      } else if (typeof action.routerLink === 'function') {
        const route = (action.routerLink as (data: any) => string[])(data);
        if (Array.isArray(route)) {
          // Navigate to absolute employee detail route
          this.router.navigate(['/employee/detail', route[1]]);
          return;
        }
      }
    }
    
    // Handle callback if defined
    if (action?.callback) {
      action.callback(data);
      return;
    }
    
    // Emit action event for other handling
    this.action.emit({ action: actionKey, data });
  }

  onItemClick(item: any, event: Event): void {
    if (this.config?.onItemClick) {
      this.config.onItemClick(item, event);
    }
  }

  // Resolve routerLink for template binding
  getActionRouterLink(action: EntityAction, data?: any): string[] | string {
    if (typeof action.routerLink === 'function') {
      return (action.routerLink as (data: any) => string[])(data) || [];
    }
    return action.routerLink || [];
  }

  // Routing for primary column and detail buttons
  getRouting(item: any): string[] {
    if (this.config?.routing) {
      return this.config.routing(item);
    }
    return [this.config.detailUrl || 'detail', item[this.idKey]];
  }

  // Track by function
  trackBy(index: number, item: any): string {
    return item[this.idKey] || index;
  }

  // Get display value for column
  getDisplayValue(item: any, column: EntityColumn): string {
    // Skip processing if item is invalid
    if (!item || typeof item !== 'object') {
      return '';
    }
    
    const value = item[column.key];
    
    // Ensure we have a valid string value
    if (value === null || value === undefined) {
      return '';
    }

    // Handle date formatting for both type: 'date' and isDate: true
    if (column.type === 'date' || column.isDate) {
      // Handle Firestore Timestamp objects
      if (value && typeof value === 'object' && value.seconds !== undefined) {
        const date = new Date(value.seconds * 1000);
        return date.toLocaleDateString();
      }
      // Handle regular date objects or timestamps
      return new Date(value).toLocaleDateString();
    }

    if (column.isBoolean && column.booleanValue) {
      return value ? column.booleanValue.true : column.booleanValue.false;
    }

    // Ensure we return a proper string with fallback
    let stringValue: string;
    if (typeof value === 'string') {
      stringValue = value;
    } else if (typeof value === 'number') {
      stringValue = value.toString();
    } else {
      stringValue = String(value || '');
    }
    
    return stringValue;
  }

  // Check if action is disabled
  isActionDisabled(action: any, item: any): boolean {
    console.log(' isActionDisabled called for action:', action.key);
    console.log(' action.disabled function:', action.disabled);
    console.log(' item:', item);
    console.log(' loading state:', this.itemsLoading);
    
    // For header actions, item is null, so don't check disabled function
    if (item === null && !action.disabled) {
      console.log(' Header action - always enabled');
      return false;
    }
    
    const result = action.disabled ? action.disabled(item) : false;
    console.log(' result:', result);
    return result;
  }

  // Get visible columns based on detail state
  get visibleColumns(): EntityColumn[] {
    // Return all configured visible columns
    return this.setting?.visibleColumns || [];
  }

  // Get checked items
  get checkedItems(): any[] {
    if (!this.setting) return [];
    
    return this.data.items.filter(item => 
      this.mapOfCheckedId[item[this.setting?.identity || 'id']]
    );
  }

  // Search handling
  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.filtersChange.emit({
      search: searchTerm
    });
    this.cdr.detectChanges();
  }

  // Pagination handling
  onPageIndexChange(pageIndex: number): void {
    this.paginationChange.emit({
      pageIndex: pageIndex + 1, // Convert from 0-based to 1-based
      pageSize: this.data.pageSize || this.config.pageSize || 10
    });
  }

  onPageSizeChange(pageSize: number): void {
    this.paginationChange.emit({
      pageIndex: 1, // Reset to first page
      pageSize: pageSize
    });
  }

  // Track by for columns
  trackByColumn(index: number, column: EntityColumn): string {
    return column.key;
  }

  // Track by for fields
  trackByField(index: number, field: EntityColumn): string {
    return field.key;
  }

  // Loading state
  get itemsLoading(): boolean {
    return this.data.loading || this.config.loading || false;
  }

  // Event handlers
  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }

  onEdit(row: any): void {
    this.edit.emit(row);
  }

  onDelete(row: any): void {
    this.delete.emit(row);
  }

  // Enhanced filter methods
  onDepartmentFilterChange(department: string): void {
    this.departmentFilter = department;
    this.applyFilters();
  }

  onStatusFilterChange(status: string): void {
    this.statusFilter = status;
    this.applyFilters();
  }


  private applyFilters(): void {
    const filters: any = {
      search: this.searchTerm,
      department: this.departmentFilter,
      status: this.statusFilter
    };

    // Emit filter changes for parent component to handle
    this.filtersChange.emit(filters);
  }

  // Get filtered items based on filters
  getFilteredItems(): any[] {
    let items = [...this.data.items];

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      items = items.filter(item => 
        (item.fullName && item.fullName.toLowerCase().includes(searchLower)) ||
        (item.email && item.email.toLowerCase().includes(searchLower)) ||
        (item.empId && item.empId.toLowerCase().includes(searchLower)) ||
        (item.department && item.department.toLowerCase().includes(searchLower)) ||
        (item.position && item.position.toLowerCase().includes(searchLower))
      );
    }

    // Apply department filter
    if (this.departmentFilter) {
      items = items.filter(item => item.department === this.departmentFilter);
    }

    // Apply status filter
    if (this.statusFilter) {
      items = items.filter(item => item.status === this.statusFilter);
    }

    return items;
  }

  // Get unique departments for filter dropdown
  getUniqueDepartments(): string[] {
    const departments = [...new Set(this.data.items.map(item => item.department).filter(Boolean))];
    return departments.sort();
  }

  // Get unique statuses for filter dropdown
  getUniqueStatuses(): string[] {
    const statuses = [...new Set(this.data.items.map(item => item.status).filter(Boolean))];
    return statuses.sort();
  }

  // Handle header action clicks
  onHeaderAction(): void {
    // Add persistent debug that won't disappear
    console.warn(' HEADER ACTION CLICKED - PERSISTENT LOG');
    console.warn(' headerAction:', JSON.stringify(this.headerAction));
    
    // Store in window for persistent debugging
    (window as any).lastHeaderActionClick = {
      timestamp: new Date().toISOString(),
      action: this.headerAction?.key,
      callback: !!this.headerAction?.callback
    };
    
    if (this.headerAction?.callback) {
      console.warn(' Executing header action callback');
      this.headerAction.callback(null);
    }
    
    // Emit action event for router link handling
    if (this.headerAction) {
      console.warn(' Emitting action event:', this.headerAction.key);
      this.action.emit({ action: this.headerAction.key, data: null });
    }
  }

  // Close detail panel
  closeDetail(): void {
    this.router.navigate(['/employee']);
  }
}
