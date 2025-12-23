from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class Player(Base):
    """Модель игрока"""
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    games_as_player1 = relationship("Game", foreign_keys="Game.player1_id", back_populates="player1")
    games_as_player2 = relationship("Game", foreign_keys="Game.player2_id", back_populates="player2")


class Game(Base):
    """Модель игры (партии)"""
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    player1_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    player2_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    winner_id = Column(Integer, ForeignKey("players.id"), nullable=True)  # NULL пока игра не закончена
    breaker_id = Column(Integer, ForeignKey("players.id"), nullable=False)  # Кто разбивает
    stake = Column(Numeric(10, 2), nullable=False)  # Ставка в рублях
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True), nullable=True)

    # Связи
    player1 = relationship("Player", foreign_keys=[player1_id], back_populates="games_as_player1")
    player2 = relationship("Player", foreign_keys=[player2_id], back_populates="games_as_player2")
    winner = relationship("Player", foreign_keys=[winner_id])
    breaker = relationship("Player", foreign_keys=[breaker_id])
