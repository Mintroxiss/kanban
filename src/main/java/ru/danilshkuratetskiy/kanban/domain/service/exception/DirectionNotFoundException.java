package ru.danilshkuratetskiy.kanban.domain.service.exception;

public class DirectionNotFoundException extends RuntimeException {
    public DirectionNotFoundException(String message) {
        super(message);
    }
}
