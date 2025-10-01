#!/usr/bin/env python3
"""
FNV-1a 32-bit hash implementation
Matches Hugo's hash.FNV32a function
"""
import sys

def fnv32a(data):
    """Compute FNV-1a 32-bit hash"""
    if isinstance(data, str):
        data = data.encode('utf-8')

    # FNV-1a parameters for 32 bits
    FNV_32_PRIME = 0x01000193
    FNV_32_OFFSET_BASIS = 0x811c9dc5

    hash_value = FNV_32_OFFSET_BASIS
    for byte in data:
        hash_value ^= byte
        hash_value = (hash_value * FNV_32_PRIME) & 0xffffffff

    return hash_value

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Read from argument
        text = sys.argv[1]
    else:
        # Read from stdin
        text = sys.stdin.read()

    print(fnv32a(text))