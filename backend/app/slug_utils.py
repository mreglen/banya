# app/slug_utils.py

def generate_slug(text: str) -> str:
    """
    Конвертирует текст кириллицей в slug латиницей.
    Пример: "Кедровая баня" → "kedrovaya-banya"
    """
    # Таблица транслитерации русских букв
    cyrillic_to_latin = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
        'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
        'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
        'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
        'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
        'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '',
        'э': 'e', 'ю': 'yu', 'я': 'ya',
    }
    
    # Приводим к нижнему регистру
    text = text.lower()
    
    # Заменяем кириллические символы
    result = []
    for char in text:
        if char in cyrillic_to_latin:
            result.append(cyrillic_to_latin[char])
        elif char.isascii() and (char.isalnum() or char in '-_'):
            result.append(char)
        elif char == ' ':
            result.append('-')
        # Остальные символы пропускаем
    
    # Собираем строку
    slug = ''.join(result)
    
    # Заменяем множественные дефисы на один
    while '--' in slug:
        slug = slug.replace('--', '-')
    
    # Удаляем дефисы в начале и конце
    slug = slug.strip('-')
    
    # Если slug пустой, используем fallback
    if not slug:
        slug = 'bath'
    
    return slug


def make_unique_slug(base_slug: str, existing_slugs: list) -> str:
    """
    Делает slug уникальным, добавляя суффикс при необходимости.
    Пример: "kedrovaya-banya" → "kedrovaya-banya-1"
    """
    slug = base_slug
    counter = 1
    
    while slug in existing_slugs:
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    return slug
