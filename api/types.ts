export interface EventItem {
  id: number;
  title: string;
  description: string;
  date: string;
  time_start: string;
  time_end: string;
}

export interface AttendanceRecord {
  id: number;
  event_id: number;
  user_id: number;
  user_type: number;
  time_in: string | null;
  time_out: string | null;
  is_present: number;
  event: EventItem;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}
