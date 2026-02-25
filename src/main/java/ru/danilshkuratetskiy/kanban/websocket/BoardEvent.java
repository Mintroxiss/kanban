package ru.danilshkuratetskiy.kanban.websocket;

public record BoardEvent(String type, Object payload) {}
