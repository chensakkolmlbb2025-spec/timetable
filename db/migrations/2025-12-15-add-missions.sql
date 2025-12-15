-- ============================================================================
-- MISSIONS TABLE - 3-Level Mission System
-- ============================================================================

-- Create enum for mission status
CREATE TYPE mission_status AS ENUM ('pending', 'today', 'completed', 'failed');

-- Create enum for priority levels
CREATE TYPE mission_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Create enum for difficulty levels
CREATE TYPE mission_difficulty AS ENUM ('easy', 'medium', 'hard', 'extreme');

-- Create missions table
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core fields
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  
  -- Classification
  status mission_status NOT NULL DEFAULT 'pending',
  priority mission_priority NOT NULL DEFAULT 'medium',
  difficulty mission_difficulty NOT NULL DEFAULT 'medium',
  
  -- Optional link to timetable
  timeblock_id UUID REFERENCES time_blocks(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  tags TEXT[] DEFAULT '{}'
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_missions_user_id ON missions(user_id);
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_missions_deadline ON missions(deadline);
CREATE INDEX idx_missions_user_status ON missions(user_id, status);
CREATE INDEX idx_missions_user_deadline ON missions(user_id, deadline);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own missions
CREATE POLICY "Users can view own missions"
  ON missions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own missions
CREATE POLICY "Users can insert own missions"
  ON missions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own missions
CREATE POLICY "Users can update own missions"
  ON missions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own missions
CREATE POLICY "Users can delete own missions"
  ON missions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_missions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_missions_updated_at
  BEFORE UPDATE ON missions
  FOR EACH ROW
  EXECUTE FUNCTION update_missions_updated_at();

-- ============================================================================
-- REALTIME
-- ============================================================================

-- Enable realtime for missions table
ALTER PUBLICATION supabase_realtime ADD TABLE missions;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to move pending missions to today when deadline arrives
CREATE OR REPLACE FUNCTION move_missions_to_today()
RETURNS INTEGER AS $$
DECLARE
  moved_count INTEGER;
BEGIN
  UPDATE missions
  SET status = 'today',
      updated_at = NOW()
  WHERE status = 'pending'
    AND DATE(deadline AT TIME ZONE 'Asia/Phnom_Penh') <= CURRENT_DATE;
  
  GET DIAGNOSTICS moved_count = ROW_COUNT;
  RETURN moved_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark overdue today missions as failed
CREATE OR REPLACE FUNCTION fail_overdue_missions()
RETURNS INTEGER AS $$
DECLARE
  failed_count INTEGER;
BEGIN
  UPDATE missions
  SET status = 'failed',
      failed_at = NOW(),
      updated_at = NOW()
  WHERE status = 'today'
    AND deadline < NOW();
  
  GET DIAGNOSTICS failed_count = ROW_COUNT;
  RETURN failed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old completed missions (keep only last 10 per user)
CREATE OR REPLACE FUNCTION cleanup_old_completed_missions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT DISTINCT user_id FROM missions WHERE status = 'completed'
  LOOP
    WITH ranked AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY completed_at DESC) as rn
      FROM missions
      WHERE user_id = user_record.user_id AND status = 'completed'
    )
    DELETE FROM missions
    WHERE id IN (SELECT id FROM ranked WHERE rn > 10);
    
    deleted_count := deleted_count + (SELECT COUNT(*) FROM ranked WHERE rn > 10);
  END LOOP;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE missions IS '3-Level Mission System: Pool → Today → Completed/Failed';
COMMENT ON COLUMN missions.status IS 'pending=Pool, today=Must do today, completed=Done, failed=Missed deadline';
COMMENT ON COLUMN missions.timeblock_id IS 'Optional link to a specific time block in the timetable';
