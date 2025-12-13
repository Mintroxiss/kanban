package ru.danilshkuratetskiy.kanban.domain.service.exception;

public class EpicNotFoundException extends RuntimeException {
    public EpicNotFoundException(String message) {
        super(message);
    }
}
