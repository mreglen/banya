#!/usr/bin/env python3
"""
Скрипт для миграции базы данных - добавление поля slug в таблицу baths
Запускать на сервере: python migrate_add_slug.py
"""

import sys
import os

# Добавляем путь к проекту
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Bath
from app.slug_utils import generate_slug, make_unique_slug

def migrate():
    """Выполняет миграцию базы данных"""
    db = SessionLocal()
    
    try:
        print("Начинаем миграцию: добавление поля slug...")
        
        # Получаем все бани
        baths = db.query(Bath).all()
        print(f"Найдено {len(baths)} бань")
        
        # Получаем существующие slug
        existing_slugs = [b.slug for b in baths if b.slug]
        
        updated_count = 0
        for bath in baths:
            # Если slug уже есть, пропускаем
            if bath.slug:
                print(f"✓ Баня '{bath.name}' уже имеет slug: {bath.slug}")
                continue
            
            # Генерируем slug
            base_slug = generate_slug(bath.name)
            slug = make_unique_slug(base_slug, existing_slugs)
            
            # Обновляем баню
            bath.slug = slug
            existing_slugs.append(slug)
            updated_count += 1
            print(f"✓ Обновлено: '{bath.name}' → {slug}")
        
        db.commit()
        print(f"\n✅ Миграция завершена! Обновлено {updated_count} бань.")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Ошибка миграции: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
