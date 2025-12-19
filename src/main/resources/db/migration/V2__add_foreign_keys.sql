-- Boards → Directions
ALTER TABLE boards
    ADD CONSTRAINT fk_board_direction
    FOREIGN KEY (direction_id)
    REFERENCES directions(id);

-- Columns → Boards
ALTER TABLE columns
    ADD CONSTRAINT fk_column_board
    FOREIGN KEY (board_id)
    REFERENCES boards(id);

-- Teams → Directions
ALTER TABLE teams
    ADD CONSTRAINT fk_team_direction
    FOREIGN KEY (direction_id)
    REFERENCES directions(id);

-- Users → Teams
ALTER TABLE users
    ADD CONSTRAINT fk_user_team
    FOREIGN KEY (team_id)
    REFERENCES teams(id);

-- Epics → Boards
ALTER TABLE epics
    ADD CONSTRAINT fk_epic_board
    FOREIGN KEY (board_id)
    REFERENCES boards(id);

-- Epics → Teams
ALTER TABLE epics
    ADD CONSTRAINT fk_epic_team
    FOREIGN KEY (team_id)
    REFERENCES teams(id);

-- Tasks → Epics
ALTER TABLE tasks
    ADD CONSTRAINT fk_task_epic
    FOREIGN KEY (epic_id)
    REFERENCES epics(id);

-- Tasks → Columns
ALTER TABLE tasks
    ADD CONSTRAINT fk_task_column
    FOREIGN KEY (column_id)
    REFERENCES columns(id);

-- Tasks → Users (assignee)
ALTER TABLE tasks
    ADD CONSTRAINT fk_task_assignee
    FOREIGN KEY (assignee_id)
    REFERENCES users(id);
