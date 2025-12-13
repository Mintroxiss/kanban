-- =========================
-- DIRECTIONS
-- =========================
CREATE TABLE directions (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(2000)
);

-- =========================
-- BOARDS
-- =========================
CREATE TABLE boards (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    direction_id UUID NOT NULL
);

-- =========================
-- COLUMNS
-- =========================
CREATE TABLE columns (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    board_id UUID NOT NULL,
    order_index INTEGER NOT NULL,

    CONSTRAINT uq_board_order UNIQUE (board_id, order_index)
);

-- =========================
-- TEAMS
-- =========================
CREATE TABLE teams (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    direction_id UUID NOT NULL,
    team_lead_id UUID UNIQUE
);

-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id UUID PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    team_id UUID NOT NULL
);

-- =========================
-- EPICS
-- =========================
CREATE TABLE epics (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    board_id UUID NOT NULL,

    CONSTRAINT uq_board_epic_title UNIQUE (board_id, title)
);

-- =========================
-- TASKS
-- =========================
CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    deadline DATE NOT NULL,
    assignee_id UUID,
    column_id UUID,
    epic_id UUID NOT NULL
);
