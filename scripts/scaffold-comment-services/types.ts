export interface NameVariants {
  kebab: string;        // 'purchase-order'
  kebabFull: string;    // 'purchase-order-comment'
  snake: string;        // 'purchase_order'
  snakeFull: string;    // 'purchase_order_comment'
  pascal: string;       // 'PurchaseOrder'
  pascalFull: string;   // 'PurchaseOrderComment'
  camel: string;        // 'purchaseOrder'
  camelFull: string;    // 'purchaseOrderComment'
  parentIdField: string; // 'purchase_order_id'
}

export interface MissingService {
  kebabFull: string;    // directory name in gateway: 'purchase-order-comment'
  domain: 'master' | 'procurement' | 'inventory';
  names: NameVariants;
}

export interface Template {
  controller: string;
  service: string;
  module: string;
}

export interface RenderedService {
  controller: string;
  service: string;
  module: string;
}
