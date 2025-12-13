package ru.danilshkuratetskiy.kanban.domain.service.exception;

public class TeamNotFoundException extends RuntimeException {
    public TeamNotFoundException(String message) {
        super(message);
    }
}
