export interface TableColumn<T = unknown> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  formatter?: (value: unknown, row: T) => string;
  cssClass?: string | ((value: unknown, row: T) => string);
}

export interface ModalConfig {
  title: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface SelectOption {
  label: string;
  value: string | number;
}
