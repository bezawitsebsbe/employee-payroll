import { EntityColumn, EntityConfig, EntityAction } from '@employee-payroll/entity';

export const attendanceTableConfig: EntityConfig = {
  columns: [
    {
      key: 'avatar',
      label: '',
      type: 'avatar',
      width: '80px',
      sortable: false
    },
    {
      key: 'fullName',
      label: 'Employee',
      type: 'text',
      width: '200px',
      sortable: true
    },
    {
      key: 'department',
      label: 'Department',
      type: 'text',
      width: '120px',
      sortable: true
    },
    {
      key: 'checkin',
      label: 'Check In',
      type: 'text',
      width: '120px',
      sortable: true
    },
    {
      key: 'checkout',
      label: 'Check Out',
      type: 'text',
      width: '120px',
      sortable: true
    },
    {
      key: 'hours',
      label: 'Working Hours',
      type: 'text',
      width: '120px',
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      type: 'tag',
      width: '100px',
      sortable: true,
      tagColors: {
        Present: 'green',
        Absent: 'red',
        Late: 'orange'
      }
    }
  ] as EntityColumn[],
  actions: [],
  settings: {
    showSearch: false,  // ✅ Disable duplicate search
    showPagination: true,
    showSizeChanger: true,
    pageSize: 10,
    frontPagination: true
  }
};
