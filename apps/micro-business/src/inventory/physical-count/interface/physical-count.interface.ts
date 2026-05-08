export interface IPhysicalCountCreate {
  physical_count_period_id: string;
  location_id: string;
  description?: string;
}

export interface IPhysicalCountSave {
  id: string;
  details: {
    id: string;
    actual_qty: number;
  }[];
}

export interface IPhysicalCountSubmit {
  id: string;
}

export interface IPhysicalCountDetailCommentAttachment {
  fileName: string;
  fileToken: string;
  fileUrl?: string;
  contentType: string;
  size?: number;
}

export interface IPhysicalCountDetailCommentCreate {
  physical_count_detail_id: string;
  message?: string | null;
  type?: 'user' | 'system';
  attachments?: IPhysicalCountDetailCommentAttachment[];
}

export interface IPhysicalCountDetailCommentUpdate {
  id: string;
  message?: string | null;
  attachments?: IPhysicalCountDetailCommentAttachment[];
}
