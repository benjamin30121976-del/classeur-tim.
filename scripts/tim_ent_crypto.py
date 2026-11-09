"""Chiffrement des archives ENT de Tim : RSA-OAEP + AES-256-GCM.

La cle privee reste exclusivement dans la bibliotheque privee du parent.
Le depot GitHub public ne contient que la cle publique et le programme.
"""
from __future__ import annotations

import argparse
import os
import struct
import zipfile
from pathlib import Path

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

MAGIC = b"TIM-ENT2\0"
LIMIT = 350 * 1024 * 1024


def encrypt(source: Path, destination: Path, public_pem: Path) -> None:
    if not source.is_dir():
        raise ValueError("Le repertoire source n'existe pas")
    import io
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for path in sorted(source.rglob("*")):
            if path.is_file():
                archive.write(path, path.relative_to(source).as_posix())
    plain = buf.getvalue()
    if not plain or len(plain) > LIMIT:
        raise ValueError("Archive vide ou trop importante")
    pub = serialization.load_pem_public_key(public_pem.read_bytes())
    if not isinstance(pub, rsa.RSAPublicKey) or pub.key_size < 3072:
        raise ValueError("Cle publique RSA non conforme")
    aes_key, nonce = os.urandom(32), os.urandom(12)
    wrapped = pub.encrypt(
        aes_key,
        padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()),
                     algorithm=hashes.SHA256(), label=None),
    )
    sealed = AESGCM(aes_key).encrypt(nonce, plain, MAGIC)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(MAGIC + struct.pack(">H", len(wrapped)) + wrapped + nonce + sealed)
    print("Archive chiffrée créée ; aucun document scolaire en clair publié.")


def decrypt(source: Path, destination: Path, private_pem: Path) -> None:
    import io
    data = source.read_bytes()
    if not data.startswith(MAGIC):
        raise ValueError("Format de l'archive non reconnu")
    p = len(MAGIC)
    if len(data) < p + 2:
        raise ValueError("Archive incomplete")
    wrapped_len = struct.unpack(">H", data[p:p + 2])[0]
    p += 2
    wrapped = data[p:p + wrapped_len]
    p += wrapped_len
    nonce, ciphertext = data[p:p + 12], data[p + 12:]
    if len(nonce) != 12 or not ciphertext:
        raise ValueError("Archive tronquee")
    priv = serialization.load_pem_private_key(private_pem.read_bytes(), password=None)
    aes_key = priv.decrypt(
        wrapped,
        padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()),
                     algorithm=hashes.SHA256(), label=None),
    )
    plain = AESGCM(aes_key).decrypt(nonce, ciphertext, MAGIC)
    if len(plain) > LIMIT:
        raise ValueError("Archive trop volumineuse")
    destination.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(plain)) as archive:
        if sum(info.file_size for info in archive.infolist()) > LIMIT:
            raise ValueError("Extraction trop volumineuse")
        for info in archive.infolist():
            pth = Path(info.filename)
            if pth.is_absolute() or ".." in pth.parts or info.is_dir() and info.filename.startswith("/"):
                raise ValueError("Chemin interdit dans l'archive")
        archive.extractall(destination)
    print("Archive dechiffree dans", destination)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["encrypt", "decrypt"])
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("key", type=Path)
    args = parser.parse_args()
    (encrypt if args.mode == "encrypt" else decrypt)(args.source, args.destination, args.key)


if __name__ == "__main__":
    main()
