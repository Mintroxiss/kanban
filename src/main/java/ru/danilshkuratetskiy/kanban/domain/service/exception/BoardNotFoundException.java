package ru.danilshkuratetskiy.kanban.domain.service.exception;

public class BoardNotFoundException extends RuntimeException {
    public BoardNotFoundException(String message) {
        super(message);
    }
}
