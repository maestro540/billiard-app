from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from collections import defaultdict

from . import models, schemas


# ============== Players ==============

def create_player(db: Session, player: schemas.PlayerCreate) -> models.Player:
    """Создать нового игрока"""
    db_player = models.Player(name=player.name)
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player


def get_player(db: Session, player_id: int) -> Optional[models.Player]:
    """Получить игрока по ID"""
    return db.query(models.Player).filter(models.Player.id == player_id).first()


def get_players(db: Session) -> List[models.Player]:
    """Получить всех игроков"""
    return db.query(models.Player).order_by(models.Player.name).all()


def delete_player(db: Session, player_id: int) -> bool:
    """Удалить игрока"""
    player = get_player(db, player_id)
    if player:
        db.delete(player)
        db.commit()
        return True
    return False


# ============== Games ==============

def create_game(db: Session, game: schemas.GameCreate) -> models.Game:
    """Создать новую игру"""
    db_game = models.Game(
        player1_id=game.player1_id,
        player2_id=game.player2_id,
        breaker_id=game.breaker_id,
        stake=game.stake
    )
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    return db_game


def get_game(db: Session, game_id: int) -> Optional[models.Game]:
    """Получить игру по ID"""
    return db.query(models.Game).filter(models.Game.id == game_id).first()


def get_games(db: Session, limit: int = 50) -> List[models.Game]:
    """Получить последние игры"""
    return db.query(models.Game).order_by(models.Game.created_at.desc()).limit(limit).all()


def get_active_games(db: Session) -> List[models.Game]:
    """Получить активные (незавершённые) игры"""
    return db.query(models.Game).filter(models.Game.winner_id.is_(None)).order_by(models.Game.created_at.desc()).all()


def finish_game(db: Session, game_id: int, winner_id: int) -> Optional[models.Game]:
    """Завершить игру, указав победителя"""
    game = get_game(db, game_id)
    if game and game.winner_id is None:
        game.winner_id = winner_id
        game.finished_at = datetime.utcnow()
        db.commit()
        db.refresh(game)
        return game
    return None


def delete_game(db: Session, game_id: int) -> bool:
    """Удалить игру"""
    game = get_game(db, game_id)
    if game:
        db.delete(game)
        db.commit()
        return True
    return False


# ============== Statistics ==============

def get_player_stats(db: Session, player_id: int) -> Optional[schemas.PlayerStats]:
    """Получить статистику игрока"""
    player = get_player(db, player_id)
    if not player:
        return None

    # Все завершённые игры игрока
    games = db.query(models.Game).filter(
        models.Game.winner_id.isnot(None),
        or_(
            models.Game.player1_id == player_id,
            models.Game.player2_id == player_id
        )
    ).all()

    total_games = len(games)
    wins = sum(1 for g in games if g.winner_id == player_id)
    losses = total_games - wins

    total_won = sum(g.stake for g in games if g.winner_id == player_id)
    total_lost = sum(g.stake for g in games if g.winner_id != player_id)

    return schemas.PlayerStats(
        id=player.id,
        name=player.name,
        total_games=total_games,
        wins=wins,
        losses=losses,
        win_rate=round(wins / total_games * 100, 1) if total_games > 0 else 0,
        total_won=total_won,
        total_lost=total_lost,
        balance=total_won - total_lost
    )


def get_all_debts(db: Session) -> List[schemas.DebtResponse]:
    """Рассчитать все долги между игроками"""
    # Получаем все завершённые игры
    games = db.query(models.Game).filter(models.Game.winner_id.isnot(None)).all()

    # Считаем баланс между каждой парой игроков
    balances = defaultdict(Decimal)

    for game in games:
        winner_id = game.winner_id
        loser_id = game.player1_id if game.player2_id == winner_id else game.player2_id

        # loser должен winner
        key = (loser_id, winner_id)
        balances[key] += game.stake

    # Сворачиваем взаимные долги
    debts = []
    processed = set()

    for (from_id, to_id), amount in balances.items():
        if (from_id, to_id) in processed or (to_id, from_id) in processed:
            continue

        reverse_amount = balances.get((to_id, from_id), Decimal(0))
        net = amount - reverse_amount

        if net > 0:
            from_player = get_player(db, from_id)
            to_player = get_player(db, to_id)
            debts.append(schemas.DebtResponse(
                from_player=from_player,
                to_player=to_player,
                amount=net
            ))
        elif net < 0:
            from_player = get_player(db, to_id)
            to_player = get_player(db, from_id)
            debts.append(schemas.DebtResponse(
                from_player=from_player,
                to_player=to_player,
                amount=abs(net)
            ))

        processed.add((from_id, to_id))
        processed.add((to_id, from_id))

    return debts


def get_head_to_head(db: Session, player1_id: int, player2_id: int) -> Optional[schemas.HeadToHead]:
    """Статистика личных встреч между двумя игроками"""
    player1 = get_player(db, player1_id)
    player2 = get_player(db, player2_id)

    if not player1 or not player2:
        return None

    games = db.query(models.Game).filter(
        models.Game.winner_id.isnot(None),
        or_(
            and_(models.Game.player1_id == player1_id, models.Game.player2_id == player2_id),
            and_(models.Game.player1_id == player2_id, models.Game.player2_id == player1_id)
        )
    ).all()

    player1_wins = sum(1 for g in games if g.winner_id == player1_id)
    player2_wins = sum(1 for g in games if g.winner_id == player2_id)

    return schemas.HeadToHead(
        player1=player1,
        player2=player2,
        player1_wins=player1_wins,
        player2_wins=player2_wins,
        total_games=len(games)
    )
