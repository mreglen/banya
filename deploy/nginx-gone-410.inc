# URI /%3C/p декодируется в /</p и попадает сюда.
# return внутри if не отдаёт кастомное тело и error_page, поэтому только location.
location ~ ^/< {
    default_type text/html;
    charset utf-8;
    add_header X-Robots-Tag "noindex, nofollow" always;
    add_header Cache-Control "no-store" always;
    return 410 '<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><title>Страница удалена</title></head><body><p>Этой страницы нет.</p></body></html>';
}
