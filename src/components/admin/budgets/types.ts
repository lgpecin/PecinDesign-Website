export type Service = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  delivery_days: number;
  hours: number;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  display_order: number;
};

export type BudgetClient = {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientService = {
  id: string;
  client_id: string;
  template_service_id: string | null;
  name: string;
  description: string | null;
  category: string;
  price: number;
  delivery_days: number;
  hours: number;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  display_order: number;
};

export type ClientBudget = {
  id: string;
  user_id: string;
  client_id: string;
  name: string;
  status: string;
  start_date: string | null;
  discount_type: "none" | "value" | "percent" | string;
  discount_value: number;
  notes: string | null;
  validity_label?: string | null;
  client_display_name?: string | null;
  share_on_board?: boolean | null;
  accepted_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type BudgetItem = {
  id: string;
  budget_id: string;
  client_service_id: string | null;
  name: string;
  description: string | null;
  price: number;
  delivery_days: number;
  hours: number;
  quantity: number;
  group_label: string | null;
  group_color: string | null;
  display_order: number;
  created_at: string;
};

// ── Briefings Modulares ──
export type BriefingFieldType =
  | "text"
  | "textarea"
  | "email"
  | "links"
  | "tags"
  | "radio"
  | "checkbox"
  | "colors"
  | "files";

export type BriefingField = {
  id: string;
  section?: string;
  label: string;
  type: BriefingFieldType;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  options?: string[];
  allowOther?: boolean;
};

export type BriefingTemplate = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  schema: BriefingField[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type BriefingResponseValue = string | string[] | { text?: string; swatches?: string[]; files?: { name: string; url: string }[] };

export type ClientBriefing = {
  id: string;
  user_id: string;
  client_id: string;
  template_id: string | null;
  title: string;
  share_token: string;
  questions_snapshot: BriefingField[];
  responses: Record<string, any>;
  status: "pending" | "submitted" | string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

// ── Quadro Modular do Cliente (4 Colunas) ──
export type BoardBlockType =
  | "logo"
  | "palette"
  | "typography"
  | "budgets"
  | "kanban"
  | "documents"
  | "files"
  | "links"
  | "notes";

export type ClientBoard = {
  id: string;
  user_id: string;
  client_id: string;
  share_token: string;
  is_active: boolean;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ClientBoardBlock = {
  id: string;
  board_id: string;
  block_type: BoardBlockType;
  title: string;
  col_span: 1 | 2 | 3 | 4;
  display_order: number;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type KanbanStatus = "backlog" | "todo" | "doing" | "done";

export type ClientKanbanCard = {
  id: string;
  board_id: string;
  user_id: string;
  column_key: KanbanStatus | string;
  title: string;
  description: string | null;
  priority?: "normal" | "high" | string;
  tags: string[];
  due_date: string | null;
  checklist: { id: string; text: string; done: boolean }[];
  display_order: number;
  created_at: string;
  updated_at: string;
};
