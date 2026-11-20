export interface Person {
  id: number;
  name: string;
}

export interface Food {
  id: number;
  name: string;
}

export interface TimeEntry {
  id: number;
  person_id: number;
  entry_date: string;
  start_time: string;
  end_time: string;
  report?: string | null;
  food?: string | null;
  foods?: Food[];
}

export interface TimeEntryInput {
  person_id: number;
  entry_date: string;
  start_time: string;
  end_time: string;
  food_ids: number[];
  report?: string;
}