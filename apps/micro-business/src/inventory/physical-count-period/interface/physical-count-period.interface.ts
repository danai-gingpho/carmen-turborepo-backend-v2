export interface IPhysicalCountPeriodCreate {
  counting_period_from_date: string | Date;
  counting_period_to_date: string | Date;
  status?: string;
}

export interface IPhysicalCountPeriodUpdate {
  id: string;
  counting_period_from_date?: string | Date;
  counting_period_to_date?: string | Date;
  status?: string;
}
