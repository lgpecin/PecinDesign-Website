-- ============================================================
-- Pecin Design Studio Admin: Budgets Enhancements, Briefings & Client Boards
-- ============================================================

-- 1. Extend client_budgets with document persistence and board sharing
ALTER TABLE public.client_budgets
  ADD COLUMN IF NOT EXISTS validity_label TEXT DEFAULT '15 dias',
  ADD COLUMN IF NOT EXISTS client_display_name TEXT,
  ADD COLUMN IF NOT EXISTS share_on_board BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- 2. Briefing Templates (modular form schemas)
CREATE TABLE IF NOT EXISTS public.briefing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.briefing_templates TO authenticated;
GRANT ALL ON public.briefing_templates TO service_role;

ALTER TABLE public.briefing_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage briefing templates" ON public.briefing_templates;
CREATE POLICY "Owners manage briefing templates"
  ON public.briefing_templates FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_briefing_templates_updated_at ON public.briefing_templates;
CREATE TRIGGER update_briefing_templates_updated_at
  BEFORE UPDATE ON public.briefing_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Client Briefings (per-client instances + secret share link)
CREATE TABLE IF NOT EXISTS public.client_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.budget_clients(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.briefing_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  share_token TEXT NOT NULL UNIQUE,
  questions_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_briefings_client ON public.client_briefings(client_id);
CREATE INDEX IF NOT EXISTS idx_client_briefings_token ON public.client_briefings(share_token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_briefings TO authenticated;
GRANT ALL ON public.client_briefings TO service_role;

ALTER TABLE public.client_briefings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage client briefings" ON public.client_briefings;
CREATE POLICY "Owners manage client briefings"
  ON public.client_briefings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_client_briefings_updated_at ON public.client_briefings;
CREATE TRIGGER update_client_briefings_updated_at
  BEFORE UPDATE ON public.client_briefings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Client Boards (adaptive 4-column portal per client)
CREATE TABLE IF NOT EXISTS public.client_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID NOT NULL UNIQUE REFERENCES public.budget_clients(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  title TEXT NOT NULL DEFAULT 'Portal do Cliente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_boards_token ON public.client_boards(share_token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_boards TO authenticated;
GRANT ALL ON public.client_boards TO service_role;

ALTER TABLE public.client_boards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage client boards" ON public.client_boards;
CREATE POLICY "Owners manage client boards"
  ON public.client_boards FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_client_boards_updated_at ON public.client_boards;
CREATE TRIGGER update_client_boards_updated_at
  BEFORE UPDATE ON public.client_boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Client Board Blocks (1..4 col_span modular blocks)
CREATE TABLE IF NOT EXISTS public.client_board_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.client_boards(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL,
  title TEXT NOT NULL,
  col_span INTEGER NOT NULL DEFAULT 2 CHECK (col_span BETWEEN 1 AND 4),
  display_order INTEGER NOT NULL DEFAULT 0,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_board_blocks_board ON public.client_board_blocks(board_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_board_blocks TO authenticated;
GRANT ALL ON public.client_board_blocks TO service_role;

ALTER TABLE public.client_board_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage board blocks" ON public.client_board_blocks;
CREATE POLICY "Owners manage board blocks"
  ON public.client_board_blocks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_boards b
      WHERE b.id = client_board_blocks.board_id AND b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.client_boards b
      WHERE b.id = client_board_blocks.board_id AND b.user_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS update_client_board_blocks_updated_at ON public.client_board_blocks;
CREATE TRIGGER update_client_board_blocks_updated_at
  BEFORE UPDATE ON public.client_board_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Client Kanban Cards (per-board read-only progress for client)
CREATE TABLE IF NOT EXISTS public.client_kanban_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.client_boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  column_key TEXT NOT NULL DEFAULT 'todo',
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  tags TEXT[] NOT NULL DEFAULT '{}',
  due_date DATE,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_kanban_cards_board ON public.client_kanban_cards(board_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_kanban_cards TO authenticated;
GRANT ALL ON public.client_kanban_cards TO service_role;

ALTER TABLE public.client_kanban_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage client kanban cards" ON public.client_kanban_cards;
CREATE POLICY "Owners manage client kanban cards"
  ON public.client_kanban_cards FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_client_kanban_cards_updated_at ON public.client_kanban_cards;
CREATE TRIGGER update_client_kanban_cards_updated_at
  BEFORE UPDATE ON public.client_kanban_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Storage Bucket for client-assets (brand logos, files, briefing references)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('client-assets', 'client-assets', true, 15728640)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public view client-assets" ON storage.objects;
CREATE POLICY "Public view client-assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'client-assets');

DROP POLICY IF EXISTS "Admins manage client-assets" ON storage.objects;
CREATE POLICY "Admins manage client-assets"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'client-assets' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'client-assets' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public upload briefing references" ON storage.objects;
CREATE POLICY "Public upload briefing references"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'client-assets'
    AND (storage.foldername(name))[1] = 'briefing-uploads'
  );

-- 8. Public Token RPCs (Strictly scoped by secret share_token)
CREATE OR REPLACE FUNCTION public.get_public_briefing(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', b.id,
    'title', b.title,
    'status', b.status,
    'submitted_at', b.submitted_at,
    'questions_snapshot', b.questions_snapshot,
    'responses', b.responses,
    'share_token', b.share_token,
    'client_name', c.name,
    'client_company', c.company
  )
  INTO v_result
  FROM public.client_briefings b
  JOIN public.budget_clients c ON c.id = b.client_id
  WHERE b.share_token = p_token
  LIMIT 1;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_public_briefing(p_token TEXT, p_responses JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated public.client_briefings%ROWTYPE;
BEGIN
  UPDATE public.client_briefings
  SET
    responses = p_responses,
    status = 'submitted',
    submitted_at = now()
  WHERE share_token = p_token
  RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Briefing não encontrado';
  END IF;

  RETURN jsonb_build_object(
    'id', v_updated.id,
    'status', v_updated.status,
    'submitted_at', v_updated.submitted_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_board(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_board public.client_boards%ROWTYPE;
  v_client RECORD;
  v_blocks JSONB;
  v_cards JSONB;
  v_budgets JSONB;
BEGIN
  SELECT * INTO v_board
  FROM public.client_boards
  WHERE share_token = p_token AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT name, company INTO v_client
  FROM public.budget_clients
  WHERE id = v_board.client_id;

  SELECT COALESCE(jsonb_agg(to_jsonb(blk) ORDER BY blk.display_order ASC), '[]'::jsonb)
  INTO v_blocks
  FROM public.client_board_blocks blk
  WHERE blk.board_id = v_board.id;

  SELECT COALESCE(jsonb_agg(to_jsonb(crd) ORDER BY crd.display_order ASC), '[]'::jsonb)
  INTO v_cards
  FROM public.client_kanban_cards crd
  WHERE crd.board_id = v_board.id;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', cb.id,
      'name', cb.name,
      'status', cb.status,
      'start_date', cb.start_date,
      'validity_label', cb.validity_label,
      'discount_type', cb.discount_type,
      'discount_value', cb.discount_value,
      'notes', cb.notes,
      'accepted_at', cb.accepted_at,
      'items', COALESCE((
        SELECT jsonb_agg(to_jsonb(bi) ORDER BY bi.display_order ASC)
        FROM public.budget_items bi
        WHERE bi.budget_id = cb.id
      ), '[]'::jsonb)
    ) ORDER BY cb.created_at DESC
  ), '[]'::jsonb)
  INTO v_budgets
  FROM public.client_budgets cb
  WHERE cb.client_id = v_board.client_id AND cb.share_on_board = true;

  RETURN jsonb_build_object(
    'board', jsonb_build_object(
      'id', v_board.id,
      'title', v_board.title,
      'share_token', v_board.share_token,
      'client_name', v_client.name,
      'client_company', v_client.company
    ),
    'blocks', v_blocks,
    'kanban_cards', v_cards,
    'shared_budgets', v_budgets
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_public_budget(p_token TEXT, p_budget_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_board_client_id UUID;
  v_budget public.client_budgets%ROWTYPE;
BEGIN
  SELECT client_id INTO v_board_client_id
  FROM public.client_boards
  WHERE share_token = p_token AND is_active = true
  LIMIT 1;

  IF v_board_client_id IS NULL THEN
    RAISE EXCEPTION 'Quadro não encontrado';
  END IF;

  UPDATE public.client_budgets
  SET
    status = 'approved',
    accepted_at = COALESCE(accepted_at, now())
  WHERE id = p_budget_id
    AND client_id = v_board_client_id
    AND share_on_board = true
  RETURNING * INTO v_budget;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orçamento não encontrado ou não compartilhado';
  END IF;

  RETURN jsonb_build_object(
    'id', v_budget.id,
    'status', v_budget.status,
    'accepted_at', v_budget.accepted_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_briefing(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_briefing(TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_board(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_public_budget(TEXT, UUID) TO anon, authenticated;
