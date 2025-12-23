# 🎱 Billiard Tracker

Приложение для учёта бильярдных партий, статистики и долгов между игроками.

## 🏗 Архитектура

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Mobile App     │────▶│     Backend     │────▶│   PostgreSQL    │
│ (React Native)  │     │    (FastAPI)    │     │       DB        │
│    + Expo       │     │   порт 8000     │     │   порт 5432     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                 │
                        Docker Compose
```

## 🚀 Быстрый старт (Backend + Database)

### 1. Запуск через Docker

```bash
# Перейти в папку проекта
cd billiard-app

# Запустить всё одной командой
docker compose up --build
```

Первый запуск займёт 2-3 минуты (скачивание образов).

### 2. Проверка работы

- **API документация**: http://localhost:8000/docs
- **Проверка API**: http://localhost:8000/

### 3. Остановка

```bash
# Остановить с сохранением данных
docker compose down

# Остановить и удалить все данные
docker compose down -v
```

## 📱 Запуск мобильного приложения

### 1. Установка Node.js

Скачай с https://nodejs.org/ (версия LTS)

### 2. Установка Expo и запуск

```bash
cd mobile
npm install
npx expo start
```

### 3. Открытие на телефоне

1. Установи приложение **Expo Go** из Google Play
2. Отсканируй QR-код из терминала

## 📊 API Эндпоинты

### Игроки
| Метод | URL | Описание |
|-------|-----|----------|
| GET | /players | Список всех игроков |
| POST | /players | Создать игрока |
| GET | /players/{id} | Получить игрока |
| GET | /players/{id}/stats | Статистика игрока |
| DELETE | /players/{id} | Удалить игрока |

### Игры
| Метод | URL | Описание |
|-------|-----|----------|
| GET | /games | Последние игры |
| GET | /games/active | Активные игры |
| POST | /games | Создать игру |
| GET | /games/{id} | Получить игру |
| POST | /games/{id}/finish | Завершить игру |
| DELETE | /games/{id} | Удалить игру |

### Статистика
| Метод | URL | Описание |
|-------|-----|----------|
| GET | /debts | Все долги |
| GET | /head-to-head/{id1}/{id2} | Личные встречи |

## 🗄 Структура базы данных

### Таблица `players`
| Поле | Тип | Описание |
|------|-----|----------|
| id | integer | Уникальный ID |
| name | varchar(100) | Имя игрока |
| created_at | timestamp | Дата создания |

### Таблица `games`
| Поле | Тип | Описание |
|------|-----|----------|
| id | integer | Уникальный ID |
| player1_id | integer | ID первого игрока |
| player2_id | integer | ID второго игрока |
| winner_id | integer | ID победителя (NULL если игра не закончена) |
| breaker_id | integer | ID того, кто разбивает |
| stake | decimal | Ставка в рублях |
| created_at | timestamp | Начало игры |
| finished_at | timestamp | Конец игры |

## 🛠 Полезные команды

```bash
# Посмотреть логи
docker compose logs -f

# Логи только backend
docker compose logs -f backend

# Перезапустить backend
docker compose restart backend

# Зайти в контейнер базы данных
docker compose exec db psql -U billiard -d billiard_db

# Посмотреть таблицы
\dt

# Посмотреть игроков
SELECT * FROM players;

# Выйти из psql
\q
```

## 🔧 Решение проблем

### Порт 5432 занят
```bash
# Найти процесс
lsof -i :5432

# Или изменить порт в docker-compose.yml
ports:
  - "5433:5432"
```

### Ошибка "permission denied"
```bash
# На Mac может потребоваться
sudo chown -R $(whoami) ~/.docker
```

### Сбросить всё и начать заново
```bash
docker compose down -v
docker compose up --build
```
