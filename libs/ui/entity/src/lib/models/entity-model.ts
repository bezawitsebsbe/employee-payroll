export interface EntityColumn {
  key: string;
  name: string;
  label: string;
  type: 'text' | 'avatar' | 'tag' | 'date' | 'number' | 'boolean' | 'select' | 'email';
  width?: string;
  sortable?: boolean;
  thWidth?: string;
  tdClass?: string;
  hideSort?: boolean;
  template?: any; // ng-template reference
  prefix?: EntityColumnPrefix;
  suffix?: EntityColumnSuffix;
  onChild?: boolean;
  hasLocale?: boolean;
  hasTranslate?: boolean;
  precision?: string;
  tagColors?: Record<string, string>;
  options?: string[];
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  isDate?: boolean;
  isBoolean?: boolean;
  booleanValue?: {
    true: string;
    false: string;
  };
}

export interface EntityColumnPrefix {
  tdClass?: string;
  key: string;
  hasLocale?: boolean;
  hasTranslate?: boolean;
  precision?: string;
  booleanValue?: {
    true: string;
    false: string;
  };
}

export interface EntityColumnSuffix {
  tdClass?: string;
  key: string;
  hasLocale?: boolean;
  hasTranslate?: boolean;
  precision?: string;
  booleanValue?: {
    true: string;
    false: string;
  };
}

export interface EntityAction<T = any> {
  key: string;
  label: string;
  icon?: string;
  type: 'view' | 'edit' | 'delete' | 'custom' | 'primary' | 'danger';
  callback?: (entity: T) => void;
  disabled?: (entity: T) => boolean;
  routerLink?: string | any[] | ((entity: T) => string[]);
  visible?: (entity: T) => boolean;
}

export interface EntityTableData<T = any> {
  items: T[];
  totalItems?: number;
  currentPage?: number;
  pageSize?: number;
  loading?: boolean;
}

export interface SortEvent {
  key: string;
  value: 'ascend' | 'descend' | null;
}

export interface PaginationEvent {
  pageIndex: number;
  pageSize: number;
}

export interface GroupEvent {
  group: string;
}

export interface ViewMode {
  mode: 'list' | 'detail';
  label: string;
}

export interface EntityConfig<T = any> {
  title?: string;
  searchable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  showSizeChanger?: boolean;
  frontPagination?: boolean;
  loading?: boolean;
  otherView?: boolean;
  useClickHandler?: boolean;
  detailUrl?: string;
  columns?: EntityColumn[];
  actions?: EntityAction<T>[];
  headerAction?: EntityAction<T>;
  identity?: string; // Primary key field name
  visibleColumns?: EntityColumn[];
  showDetail?: boolean;
  primaryColumn?: EntityColumn;
  group?: string[];
  favorite?: boolean;
  showSearch?: boolean;
  showPagination?: boolean;
  showTabs?: boolean;
  showFilters?: boolean;
  tabType?: 'employee' | 'attendance';
  onItemClick?: (data: T, event: Event) => void;
  routing?: (data: T) => string[];
  detailTemplate?: any; // ng-template reference
  selectable?: boolean;
  settings?: {
    showSearch?: boolean;
    showPagination?: boolean;
    showSizeChanger?: boolean;
    pageSize?: number;
    frontPagination?: boolean;
  };
}

export interface EntitySetting {
  identity?: string;
  title?: string;
  searchable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  showSizeChanger?: boolean;
  frontPagination?: boolean;
  loading?: boolean;
  otherView?: boolean;
  useClickHandler?: boolean;
  detailUrl?: string;
  visibleColumns?: EntityColumn[];
  showDetail?: boolean;
  primaryColumn?: EntityColumn;
  actions?: EntityAction<any>[];
  group?: string[];
  favorite?: boolean;
  showTabs?: boolean;
  showFilters?: boolean;
  tabType?: 'employee' | 'attendance';
}