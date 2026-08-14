import zlib
import struct
import math

def create_floorball_png(filename, size=64):
    width = size
    height = size
    radius = size * 0.45
    center_x = width / 2.0
    center_y = height / 2.0

    # Holes definition (cx, cy, r) in normalized coordinates (-1 to 1)
    holes = [
        (0.0, 0.0, 0.16),
        (0.0, -0.45, 0.13),
        (0.40, -0.22, 0.13),
        (0.40, 0.22, 0.13),
        (0.0, 0.45, 0.13),
        (-0.40, 0.22, 0.13),
        (-0.40, -0.22, 0.13),
        (0.0, -0.78, 0.09),
        (0.55, -0.58, 0.09),
        (0.78, 0.0, 0.09),
        (0.55, 0.58, 0.09),
        (0.0, 0.78, 0.09),
        (-0.55, 0.58, 0.09),
        (-0.78, 0.0, 0.09),
        (-0.55, -0.58, 0.09),
    ]

    raw_data = bytearray()

    for y in range(height):
        raw_data.append(0) # PNG filter type 0 (None)
        for x in range(width):
            dx = (x + 0.5 - center_x) / radius
            dy = (y + 0.5 - center_y) / radius
            dist_sq = dx * dx + dy * dy

            if dist_sq > 1.0:
                # Outside sphere -> Transparent
                raw_data.extend([0, 0, 0, 0])
            else:
                dist = math.sqrt(dist_sq)
                # Anti-aliasing edge
                alpha = 255
                if dist > 0.92:
                    alpha = int(255 * (1.0 - dist) / 0.08)
                    alpha = max(0, min(255, alpha))

                # Check if inside a hole
                in_hole = False
                for hx, hy, hr in holes:
                    hdx = dx - hx
                    hdy = dy - hy
                    if hdx*hdx + hdy*hdy < hr*hr:
                        in_hole = True
                        break

                if in_hole:
                    # Dark 3D hole depth color
                    r, g, b = 25, 33, 44
                else:
                    # 3D Shading for plastic ball sphere
                    # Light source top-left (-0.5, -0.5)
                    lx, ly = -0.4, -0.5
                    dz = math.sqrt(max(0, 1.0 - dist_sq))
                    nx, ny, nz = dx, dy, dz

                    # Diffuse light
                    dot = max(0.2, (nx * lx + ny * ly + nz * 0.8) / math.sqrt(lx*lx + ly*ly + 0.64))
                    intensity = min(1.0, 0.6 + dot * 0.45)

                    r = int(248 * intensity)
                    g = int(250 * intensity)
                    b = int(252 * intensity)

                    # Dark outline border
                    if dist > 0.86:
                        factor = (dist - 0.86) / 0.14
                        r = int(r * (1.0 - factor * 0.5))
                        g = int(g * (1.0 - factor * 0.5))
                        b = int(b * (1.0 - factor * 0.5))

                raw_data.extend([r, g, b, alpha])

    # Construct PNG binary structure
    png_signature = b'\x89PNG\r\n\x1a\n'

    # IHDR Chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_chunk = create_chunk(b'IHDR', ihdr_data)

    # IDAT Chunk
    compressed_data = zlib.compress(bytes(raw_data), 9)
    idat_chunk = create_chunk(b'IDAT', compressed_data)

    # IEND Chunk
    iend_chunk = create_chunk(b'IEND', b'')

    with open(filename, 'wb') as f:
        f.write(png_signature + ihdr_chunk + idat_chunk + iend_chunk)

    print(f"Successfully generated {filename} ({width}x{height} PNG, size: {len(raw_data)} bytes)")

def create_chunk(chunk_type, data):
    checksum = zlib.crc32(chunk_type + data) & 0xffffffff
    return struct.pack('>I', len(data)) + chunk_type + data + struct.pack('>I', checksum)

if __name__ == '__main__':
    create_floorball_png('ball.png', 64)
