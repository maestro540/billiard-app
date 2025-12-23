from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from .database import engine, get_db, Base
from . import crud, schemas, models

# Создаём таблицы в базе данных
Base.metadata.create_all(bind=engine)

# Создаём приложение
app = FastAPI(
    title="Billiard Tracker API",
    description="API для учёта бильярдных партий и долгов",
    version="1.0.0"
)

# Настраиваем CORS для мобильного приложения
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== Корневой эндпоинт ==============

@app.get("/")
def read_root():
    """Проверка работоспособности API"""
    return {"status": "ok", "message": "Billiard Tracker API is running!"}


# ============== Players ==============

@app.post("/players", response_model=schemas.PlayerResponse, tags=["Players"])
def create_player(player: schemas.PlayerCreate, db: Session = Depends(get_db)):
    """Создать нового игрока"""
    return crud.create_player(db, player)


@app.get("/players", response_model=List[schemas.PlayerResponse], tags=["Players"])
def get_players(db: Session = Depends(get_db)):
    """Получить список всех игроков"""
    return crud.get_players(db)


@app.get("/players/{player_id}", response_model=schemas.PlayerResponse, tags=["Players"])
def get_player(player_id: int, db: Session = Depends(get_db)):
    """Получить игрока по ID"""
    player = crud.get_player(db, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Игрок не найден")
    return player


@app.get("/players/{player_id}/stats", response_model=schemas.PlayerStats, tags=["Players"])
def get_player_stats(player_id: int, db: Session = Depends(get_db)):
    """Получить статистику игрока"""
    stats = crud.get_player_stats(db, player_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Игрок не найден")
    return stats


@app.delete("/players/{player_id}", tags=["Players"])
def delete_player(player_id: int, db: Session = Depends(get_db)):
    """Удалить игрока"""
    if crud.delete_player(db, player_id):
        return {"status": "ok", "message": "Игрок удалён"}
    raise HTTPException(status_code=404, detail="Игрок не найден")


# ============== Games ==============

@app.post("/games", response_model=schemas.GameResponse, tags=["Games"])
def create_game(game: schemas.GameCreate, db: Session = Depends(get_db)):
    """Создать новую игру"""
    # Проверяем что игроки существуют
    if not crud.get_player(db, game.player1_id):
        raise HTTPException(status_code=404, detail="Игрок 1 не найден")
    if not crud.get_player(db, game.player2_id):
        raise HTTPException(status_code=404, detail="Игрок 2 не найден")
    if game.player1_id == game.player2_id:
        raise HTTPException(status_code=400, detail="Игрок не может играть сам с собой")
    if game.breaker_id not in [game.player1_id, game.player2_id]:
        raise HTTPException(status_code=400, detail="Разбивающий должен быть одним из игроков")

    return crud.create_game(db, game)


@app.get("/games", response_model=List[schemas.GameResponse], tags=["Games"])
def get_games(limit: int = 50, db: Session = Depends(get_db)):
    """Получить последние игры"""
    return crud.get_games(db, limit)


@app.get("/games/active", response_model=List[schemas.GameResponse], tags=["Games"])
def get_active_games(db: Session = Depends(get_db)):
    """Получить активные (незавершённые) игры"""
    return crud.get_active_games(db)


@app.get("/games/{game_id}", response_model=schemas.GameResponse, tags=["Games"])
def get_game(game_id: int, db: Session = Depends(get_db)):
    """Получить игру по ID"""
    game = crud.get_game(db, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Игра не найдена")
    return game


@app.post("/games/{game_id}/finish", response_model=schemas.GameResponse, tags=["Games"])
def finish_game(game_id: int, finish: schemas.GameFinish, db: Session = Depends(get_db)):
    """Завершить игру, указав победителя"""
    game = crud.get_game(db, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Игра не найдена")
    if game.winner_id is not None:
        raise HTTPException(status_code=400, detail="Игра уже завершена")
    if finish.winner_id not in [game.player1_id, game.player2_id]:
        raise HTTPException(status_code=400, detail="Победитель должен быть одним из игроков")

    return crud.finish_game(db, game_id, finish.winner_id)


@app.delete("/games/{game_id}", tags=["Games"])
def delete_game(game_id: int, db: Session = Depends(get_db)):
    """Удалить игру"""
    if crud.delete_game(db, game_id):
        return {"status": "ok", "message": "Игра удалена"}
    raise HTTPException(status_code=404, detail="Игра не найдена")


# ============== Statistics ==============

@app.get("/debts", response_model=List[schemas.DebtResponse], tags=["Statistics"])
def get_debts(db: Session = Depends(get_db)):
    """Получить все долги между игроками"""
    return crud.get_all_debts(db)


@app.get("/head-to-head/{player1_id}/{player2_id}", response_model=schemas.HeadToHead, tags=["Statistics"])
def get_head_to_head(player1_id: int, player2_id: int, db: Session = Depends(get_db)):
    """Статистика личных встреч между двумя игроками"""
    h2h = crud.get_head_to_head(db, player1_id, player2_id)
    if not h2h:
        raise HTTPException(status_code=404, detail="Один из игроков не найден")
    return h2h
