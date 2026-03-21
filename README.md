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
| SpringDoc OpenAPI | 2.8.8 |

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

Требуется PostgreSQL на `localhost:5432`, база данных `tehartel`.

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

| Ресурс | Основные эндпоинты |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh` |
| Boards | `GET/POST /api/boards`, `GET/PUT/DELETE /api/boards/{id}`, `GET /api/boards/archived`, `PATCH /api/boards/{id}/unarchive`, `DELETE /api/boards/{id}/permanent` |
| Columns | `GET/POST /api/columns`, `GET/PUT/DELETE /api/columns/{id}` |
| Tasks | `GET/POST /api/tasks`, `GET/PUT/DELETE /api/tasks/{id}`, `PATCH /api/tasks/{id}/move`, `PATCH /api/tasks/{id}/take`, `PATCH /api/tasks/{id}/assign`, `PATCH /api/tasks/{id}/status` |
| Epics | `GET/POST /api/epics`, `GET/PUT/DELETE /api/epics/{id}`, `GET /api/epics/board/{boardId}`, `GET /api/epics/board/{boardId}/archived`, `PATCH /api/epics/{id}/archive`, `PATCH /api/epics/{id}/restore`, `PATCH /api/epics/{id}/assign-team` |
| Teams | `GET/POST /api/teams`, `GET/PUT/DELETE /api/teams/{id}`, `GET/PUT/DELETE /api/teams/{id}/users/{userId}`, `PATCH /api/teams/{id}/lead` |
| Directions | `GET/POST /api/directions`, `GET/PUT/DELETE /api/directions/{id}`, `GET /api/directions/{id}/boards`, `GET /api/directions/{id}/teams` |
| Users | `GET/POST /api/users`, `GET/PUT/DELETE /api/users/{id}`, `PATCH /api/users/{id}/role`, `GET /api/users/{id}/tasks`, `GET /api/users/{id}/workload` |

---

## WebSocket

| Топик | Назначение |
|---|---|
| `/topic/board/{boardId}` | Изменения на конкретной доске (задачи, колонки, эпики) |
| `/topic/boards` | Глобальные события досок |
| `/topic/user/{userId}` | Персональные уведомления: смена роли, назначение в команду |

---