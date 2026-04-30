"""
Email service for sending password reset codes and other notifications.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from typing import Optional
from datetime import datetime


def send_password_reset_email(email: str, username: str, code: str) -> bool:
    """
    Send password reset email with verification code.
    
    Args:
        email: Recipient email address
        username: User's name for personalization
        code: 6-digit verification code
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = os.getenv('EMAIL_FROM')
        msg['To'] = email
        msg['Subject'] = 'Код для сброса пароля - Николаевские бани'
        
        # Plain text version
        text_body = f"""
Здравствуйте, {username}!

Ваш код для сброса пароля: {code}

Код действует 10 минут.

Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
"""
        
        # HTML version
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #16a34a;">Николаевские бани</h2>
        <p>Здравствуйте, <strong>{username}</strong>!</p>
        <p>Вы запросили сброс пароля. Ваш код подтверждения:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #16a34a;">{code}</span>
        </div>
        <p style="color: #666; font-size: 14px;">Код действует <strong>10 минут</strong>.</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
        </p>
    </div>
</body>
</html>
"""
        
        # Attach both versions
        msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))
        
        # Send email via SMTP SSL with timeout
        smtp_host = os.getenv('EMAIL_HOST')
        smtp_port = int(os.getenv('EMAIL_PORT', '465'))
        smtp_user = os.getenv('EMAIL_HOST_USER')
        smtp_password = os.getenv('EMAIL_HOST_PASSWORD')
        
        # Add timeout and retry logic
        try:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=30)
            server.ehlo()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            server.quit()
        except smtplib.SMTPServerDisconnected as e:
            print(f"SMTP connection failed, retrying once... ({e})")
            # Retry once
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=30)
            server.ehlo()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            server.quit()
        
        print(f"✅ Email sent to {email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send email to {email}: {e}")
        import traceback
        traceback.print_exc()
        return False


def send_booking_confirmation_email(
    email: str,
    client_name: str,
    bath_name: str,
    start_datetime: datetime,
    end_datetime: datetime,
    guests: int,
    total_cost: float,
    products: list = None,
    notes: str = None
) -> bool:
    """
    Send booking confirmation email to client.
    
    Args:
        email: Client email address
        client_name: Client's name
        bath_name: Name of the booked bath
        start_datetime: Booking start time
        end_datetime: Booking end time
        guests: Number of guests
        total_cost: Total booking cost
        products: List of products/services with quantity and price
        notes: Client notes
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Format date and time
        start_str = start_datetime.strftime('%d.%m.%Y %H:%M')
        end_str = end_datetime.strftime('%H:%M')
        
        # Calculate bath cost
        duration_hours = (end_datetime - start_datetime).total_seconds() / 3600
        
        # Format products list
        products_html = ''
        products_text = ''
        if products:
            products_html = """
            <h3 style="color: #16a34a; margin-top: 20px;">Дополнительные услуги:</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
                <thead>
                    <tr style="background: #f3f4f6;">
                        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Наименование</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Кол-во</th>
                        <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Цена</th>
                    </tr>
                </thead>
                <tbody>
            """
            
            products_text = "\nДополнительные услуги:\n"
            for product in products:
                product_name = product.get('name', 'Товар')
                quantity = product.get('quantity', 1)
                price = product.get('price', product.get('purchase_price', 0))
                item_total = quantity * price
                
                products_html += f"""
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">{product_name}</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">{quantity}</td>
                        <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">{item_total:.2f} ₽</td>
                    </tr>
                """
                
                products_text += f"  • {product_name}: {quantity} x {price:.2f} ₽ = {item_total:.2f} ₽\n"
            
            products_html += """
                </tbody>
            </table>
            """
        
        # Address
        address = "г. Екатеринбург, ул. Кизеловская, 18"
        
        # Plain text version
        text_body = f"""
Здравствуйте, {client_name}!

Ваша бронь в "Николаевские бани" подтверждена.

ДЕТАЛИ БРОНИРОВАНИЯ:
===================
Баня: {bath_name}
Дата: {start_str}
Время: {start_str.split(' ')[1]} - {end_str}
Количество гостей: {guests}

АДРЕС:
{address}

{products_text}

ОБЩАЯ СТОИМОСТЬ: {total_cost:.2f} ₽

Если у вас есть вопросы, свяжитесь с нами.

С уважением,
Команда "Николаевские бани"
"""
        
        # HTML version
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f9fafb; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #16a34a;">
            <h1 style="color: #16a34a; margin: 0; font-size: 28px;">Николаевские бани</h1>
            <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Бронирование подтверждено</p>
        </div>
        
        <!-- Greeting -->
        <p style="font-size: 16px;">Здравствуйте, <strong>{client_name}</strong>!</p>
        <p>Ваша бронь успешно создана. Ждём вас!</p>
        
        <!-- Booking Details -->
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h2 style="color: #16a34a; margin-top: 0; font-size: 20px;">Детали бронирования</h2>
            
            <table style="width: 100%; margin: 15px 0;">
                <tr>
                    <td style="padding: 8px 0; color: #666; width: 40%;"><strong>Баня:</strong></td>
                    <td style="padding: 8px 0; color: #333;">{bath_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #666;"><strong>Дата:</strong></td>
                    <td style="padding: 8px 0; color: #333;">{start_str.split(' ')[0]}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #666;"><strong>Время:</strong></td>
                    <td style="padding: 8px 0; color: #333;">{start_str.split(' ')[1]} - {end_str}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #666;"><strong>Продолжительность:</strong></td>
                    <td style="padding: 8px 0; color: #333;">{duration_hours:.1f} ч.</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #666;"><strong>Гостей:</strong></td>
                    <td style="padding: 8px 0; color: #333;">{guests}</td>
                </tr>
            </table>
        </div>
        
        <!-- Address -->
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #f59e0b; margin-top: 0;">Адрес</h3>
            <p style="margin: 5px 0; font-size: 16px;">{address}</p>
        </div>
        
        <!-- Products -->
        {products_html}
        
        <!-- Total Cost -->
        <div style="background: #16a34a; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">Общая стоимость</p>
            <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold;">{total_cost:.2f} ₽</p>
        </div>
        
        {f'<div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;"><strong>Комментарий:</strong> {notes}</div>' if notes else ''}
        
        <!-- Footer -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #999; font-size: 14px;">
            <p>Если у вас есть вопросы, свяжитесь с нами.</p>
            <p style="margin-top: 10px;"><strong>С уважением,<br>Команда "Николаевские бани"</strong></p>
        </div>
    </div>
</body>
</html>
"""
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = os.getenv('EMAIL_FROM')
        msg['To'] = email
        msg['Subject'] = f'Бронирование подтверждено - {bath_name} - {start_str}'
        
        # Attach both versions
        msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))
        
        # Send email via SMTP SSL with timeout
        smtp_host = os.getenv('EMAIL_HOST')
        smtp_port = int(os.getenv('EMAIL_PORT', '465'))
        smtp_user = os.getenv('EMAIL_HOST_USER')
        smtp_password = os.getenv('EMAIL_HOST_PASSWORD')
        
        # Add timeout and retry logic
        try:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=30)
            server.ehlo()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            server.quit()
        except smtplib.SMTPServerDisconnected as e:
            print(f"SMTP connection failed, retrying once... ({e})")
            # Retry once
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=30)
            server.ehlo()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            server.quit()
        
        print(f"✅ Booking confirmation email sent to {email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send booking confirmation email to {email}: {e}")
        import traceback
        traceback.print_exc()
        return False
