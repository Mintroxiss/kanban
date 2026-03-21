# ТехАртель

Веб-приложение для управления командной разработкой по методологии Kanban. Полный стек: REST API на Spring Boot + React-фронтенд с glassmorphism-дизайном и real-time обновлениями через WebSocket.

---

## Возможности

- **Доски и колонки** - создание нескольких досок, настраиваемые колонки с ручной сортировкой
- **Задачи** - drag-and-drop между колонками, назначение исполнителя, статус, дедлайн
- **Эпики** - группировка задач; архивирование с сохранением задач и последующим восстановлением
- **Команды и направления** - иерархия: Направление → Команды → Пользователи
- **Роли** - `ADMIN`, `TEAM_LEAD`, `DEVELOPER` с разграниченным доступом к функциям
- **Real-time** - все изменения на доске (задачи, колонки, эпики) мгновенно отражаются у других участников через WebSocket
- **Тёмная / светлая тема** - переключение в хедере, состояние сохраняется в `localStorage`

---

## Видео

<p align="center" width="100%">
<video src="https://github.com/user-attachments/assets/2b895a49-a5cb-4c06-9c85-adfbbaeb4b80" width="80%" controls></video>
</p>

---

## Стек технологий

### Backend
| Технология | Версия |
|---|---|
| Java | 21 |
| Spring Boot | 4.0.0 |
| Spring Security + JWT (JJWT) | 0.12.6 |
| Spring Data JPA + Hibernate | - |
| PostgreSQL | 15 |
| Flyway | - |
| MapStruct | 1.5.5 |
| Lombok | - |
| SpringDoc OpenAPI | 2.2.0 |

### Frontend
| Технология | Версия |
|---|---|
| React | 18 |
| TypeScript | - |
| Vite | - |
| Tailwind CSS | v4 |
| TanStack Query | v5 |
| Zustand | - |
| dnd-kit | - |
| React Router | v6 |

---

## Архитектура backend

Трёхслойная архитектура в пакете `ru.danilshkuratetskiy.kanban`:

```
web/          - REST-контроллеры, DTO, MapStruct-маперы (DTO - Domain)
domain/       - Доменные модели, интерфейсы и реализации сервисов, исключения
datasource/   - JPA-сущности, Spring Data репозитории, маперы (Entity - Domain)
security/     - JWT-сервис, фильтры аутентификации
config/       - Spring-конфигурация, Swagger/OpenAPI
```

Все ID - `UUID`. Схема БД управляется через Flyway-миграции; Hibernate в режиме `validate`.

---

## Запуск

### Через Docker Compose (рекомендуется)

```bash
# Сборка JAR
./gradlew bootJar

# Сборка и запуск (PostgreSQL 15 + приложение)
docker-compose build
docker-compose up
```

Приложение доступно на `http://localhost:8080`.
Swagger UI: `http://localhost:8080/swagger-ui.html`

### Локально (без Docker)

Требуется PostgreSQL на `localhost:5432`, база данных `kanban`.

```bash
./gradlew bootRun
```

### Frontend (dev-режим)

```bash
cd frontend
npm install
npm run dev
```

Фронтенд запускается на `http://localhost:5173` и проксирует API-запросы на `:8080`.

---

## API

Все эндпоинты находятся под префиксом `/api`. Полная документация доступна в Swagger UI после запуска приложения.

| Ресурс | Эндпоинты |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Boards | `GET/POST /api/boards`, `GET/PATCH/DELETE /api/boards/{id}` |
| Columns | `GET/POST /api/columns/board/{boardId}`, `PATCH/DELETE /api/columns/{id}` |
| Tasks | `GET/POST /api/tasks/column/{colId}`, `PATCH/DELETE /api/tasks/{id}`, `PATCH /api/tasks/{id}/move` |
| Epics | `GET/POST /api/epics/board/{boardId}`, `PATCH/DELETE /api/epics/{id}`, `PATCH /api/epics/{id}/archive`, `PATCH /api/epics/{id}/restore`, `GET /api/epics/board/{boardId}/archived` |
| Teams | `GET/POST /api/teams`, `PATCH/DELETE /api/teams/{id}` |
| Directions | `GET/POST /api/directions`, `PATCH/DELETE /api/directions/{id}` |
| Users | `GET /api/users`, `PATCH /api/users/{id}/role` |

---

## WebSocket

Подписка на события доски: `/topic/board/{boardId}`

Поддерживаемые типы событий: `TASK_CREATED`, `TASK_UPDATED`, `TASK_MOVED`, `TASK_DELETED`, `COLUMN_CREATED`, `COLUMN_UPDATED`, `COLUMN_DELETED`, `EPIC_CREATED`, `EPIC_UPDATED`, `EPIC_DELETED`, `EPIC_ARCHIVED`, `EPIC_RESTORED`.

---