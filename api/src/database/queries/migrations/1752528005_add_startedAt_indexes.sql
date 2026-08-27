CREATE INDEX IF NOT EXISTS idx_programs_startedAt ON programs ("startedAt");
CREATE INDEX IF NOT EXISTS idx_websites_startedAt ON websites ("startedAt");
CREATE INDEX IF NOT EXISTS idx_activeStates_startedAt ON activeStates ("startedAt");
CREATE INDEX IF NOT EXISTS idx_tags_startedAt ON tags ("startedAt");
CREATE INDEX IF NOT EXISTS idx_tags_tagNameId ON tags ("tagNameId");
CREATE INDEX IF NOT EXISTS idx_autoTags_tagNameId ON autoTags ("tagNameId");
