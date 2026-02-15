export interface IPhysicalCountCreate {
  period_id: string;
  location_id: string;
  description?: string;
}

export interface IPhysicalCountSave {
  id: string;
  details: {
    id: string;
    counted_qty: number;
  }[];
}

export interface IPhysicalCountSubmit {
  id: string;
}

export interface IPhysicalCountDetailCommentCreate {
  physical_count_detail_id: string;
  message?: string;
  attachments?: any[];
}

export interface IPhysicalCountDetailCommentUpdate {
  id: string;
  message?: string;
  attachments?: any[];
}
