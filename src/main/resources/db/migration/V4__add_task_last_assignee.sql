ALTER TABLE tasks ADD COLUMN last_assignee_id UUID REFERENCES users(id);
