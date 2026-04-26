from PIL import Image
import io


def process_image_to_webp(image_bytes: bytes, max_width: int = 1920, quality: int = 85) -> bytes:
    """
    Compress image, convert to WebP, and strip all metadata including GPS.
    
    Args:
        image_bytes: Original image bytes
        max_width: Maximum width (maintains aspect ratio)
        quality: WebP quality (0-100)
    
    Returns:
        WebP image bytes with no metadata
    """
    # Open image from bytes
    img = Image.open(io.BytesIO(image_bytes))
    
    # Convert to RGB if necessary (WebP doesn't support all modes)
    if img.mode in ('RGBA', 'LA', 'P'):
        # Create white background for transparency
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
        img = background
    elif img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Resize if too large (maintain aspect ratio)
    if img.width > max_width:
        ratio = max_width / img.width
        new_height = int(img.height * ratio)
        img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
    
    # Save as WebP with no metadata
    # By default, Pillow does NOT save EXIF/metadata when saving to WebP
    # unless explicitly provided, so all metadata is stripped
    output = io.BytesIO()
    img.save(
        output,
        format='WEBP',
        quality=quality,
        method=6  # Best compression method (0-6)
    )
    
    return output.getvalue()
