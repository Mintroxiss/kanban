-- =========================
-- DIRECTIONS
-- =========================
CREATE TABLE directions (
    id          UUID         PRIMARY KEY,
    name        VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(2000)
);

-- =========================
-- TEAMS
-- =========================
CREATE TABLE teams (
    id           UUID         PRIMARY KEY,
    name         VARCHAR(255) NOT NULL UNIQUE,
    direction_id UUID         NOT NULL REFERENCES directions(id),
    team_lead_id UUID         UNIQUE  -- ссылка на users, добавляется после
);

-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id        UUID         PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    team_id   UUID         REFERENCES teams(id),
    email     VARCHAR(255) NOT NULL UNIQUE,
    password  VARCHAR(255) NOT NULL,
    role      VARCHAR(50)  NOT NULL
);

-- Замыкаем циклическую ссылку: team_lead_id → users
ALTER TABLE teams
    ADD CONSTRAINT fk_team_lead FOREIGN KEY (team_lead_id) REFERENCES users(id);

-- =========================
-- BOARDS
-- =========================
CREATE TABLE boards (
    id           UUID         PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    direction_id UUID         NOT NULL REFERENCES directions(id),
    archived     BOOLEAN      NOT NULL DEFAULT FALSE
);

-- =========================
-- COLUMNS
-- =========================
CREATE TABLE columns (
    id          UUID         PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    board_id    UUID         NOT NULL REFERENCES boards(id),
    order_index INTEGER      NOT NULL,

    CONSTRAINT uq_board_order UNIQUE (board_id, order_index)
);

-- =========================
-- EPICS
-- =========================
CREATE TABLE epics (
    id          UUID         PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    board_id    UUID         NOT NULL REFERENCES boards(id),
    team_id     UUID         REFERENCES teams(id),
    archived    BOOLEAN      NOT NULL DEFAULT FALSE,

    CONSTRAINT uq_board_epic_title UNIQUE (board_id, title)
);

-- =========================
-- TASKS
-- =========================
CREATE TABLE tasks (
    id               UUID         PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    status           VARCHAR(50)  NOT NULL,
    created_at       TIMESTAMP    NOT NULL,
    updated_at       TIMESTAMP    NOT NULL,
    deadline         DATE         NOT NULL,
    assignee_id      UUID         REFERENCES users(id),
    last_assignee_id UUID         REFERENCES users(id),
    column_id        UUID         REFERENCES columns(id),
    epic_id          UUID         NOT NULL REFERENCES epics(id)
);
