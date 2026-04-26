"""
Phone number utilities for normalization and validation.
Handles Russian phone numbers in various formats.
"""

import re


def normalize_phone(phone: str) -> str:
    """
    Normalize phone number to +7XXXXXXXXXX format.
    Handles: +7, 8, with/without brackets, spaces, dashes
    
    Examples:
        +7 (999) 123-45-67 -> +79991234567
        8 999 123 45 67 -> +79991234567
        9991234567 -> +79991234567
        +79991234567 -> +79991234567
    """
    if not phone:
        return None
    
    # Remove all non-digit characters except leading +
    cleaned = re.sub(r'[^\d+]', '', phone)
    
    # Remove leading +
    cleaned = cleaned.lstrip('+')
    
    # Handle different formats
    if len(cleaned) == 11:
        if cleaned.startswith('8'):
            # 8XXXXXXXXXX -> +7XXXXXXXXXX
            cleaned = '7' + cleaned[1:]
        elif not cleaned.startswith('7'):
            # Invalid format (doesn't start with 7 or 8)
            return None
    elif len(cleaned) == 10:
        # XXXXXXXXXX -> +7XXXXXXXXXX
        cleaned = '7' + cleaned
    else:
        # Invalid length
        return None
    
    return '+' + cleaned


def is_phone_number(value: str) -> bool:
    """
    Check if value looks like a phone number.
    Returns True if value contains mostly digits (possibly with +, (), -, spaces)
    and has at least 10 digits.
    """
    if not value:
        return False
    
    # Remove all formatting characters
    cleaned = re.sub(r'[\s\-\(\)\+]', '', value)
    
    # Check if it's all digits and has proper length
    return cleaned.isdigit() and len(cleaned) >= 10


def format_phone(phone: str) -> str:
    """
    Format phone number for display: +7 (XXX) XXX-XX-XX
    """
    normalized = normalize_phone(phone)
    if not normalized:
        return phone
    
    # Remove +7
    digits = normalized[1:]  # 79991234567
    
    if len(digits) != 11:
        return normalized
    
    # Format: +7 (999) 123-45-67
    return f"+7 ({digits[1:4]}) {digits[4:7]}-{digits[7:9]}-{digits[9:11]}"
