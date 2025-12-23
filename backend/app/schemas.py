from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from typing import Optional


# ============== Player Schemas ==============

class PlayerCreate(BaseModel):
    """Схема для создания игрока"""
    name: str


class PlayerResponse(BaseModel):
    """Схема ответа с данными игрока"""
    id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class PlayerStats(BaseModel):
    """Статистика игрока"""
    id: int
    name: str
    total_games: int
    wins: int
    losses: int
    win_rate: float
    total_won: Decimal  # Сколько выиграл денег
    total_lost: Decimal  # Сколько проиграл денег
    balance: Decimal  # Общий баланс


# ============== Game Schemas ==============

class GameCreate(BaseModel):
    """Схема для создания игры"""
    player1_id: int
    player2_id: int
    breaker_id: int
    stake: Decimal


class GameFinish(BaseModel):
    """Схема для завершения игры"""
    winner_id: int


class GameResponse(BaseModel):
    """Схема ответа с данными игры"""
    id: int
    player1: PlayerResponse
    player2: PlayerResponse
    winner: Optional[PlayerResponse] = None
    breaker: PlayerResponse
    stake: Decimal
    created_at: datetime
    finished_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============== Debt Schemas ==============

class DebtResponse(BaseModel):
    """Долг между двумя игроками"""
    from_player: PlayerResponse
    to_player: PlayerResponse
    amount: Decimal


class HeadToHead(BaseModel):
    """Статистика личных встреч"""
    player1: PlayerResponse
    player2: PlayerResponse
    player1_wins: int
    player2_wins: int
    total_games: int
