package ru.danilshkuratetskiy.kanban.domain.service.exception;

public class ColumnNotFoundException extends RuntimeException {
    public ColumnNotFoundException(String message) {
        super(message);
    }
}
