#!/usr/bin/env python3
"""Build a standalone test-fixture-standalone.html by concatenating all
shared modules and inlining them in a single <script type="module"> block.
Dexie is still imported from its CDN URL (absolute URLs work on file://)."""

import re
from pathlib import Path

BASE = Path(__file__).parent

FILES_IN_ORDER = [
    "shared/events.js",
    "shared/db.js",
    "shared/relationships.js",
    "shared/fixture-data.js",
    "test-fixture.mjs",
]

def strip(src: str) -> str:
    # Multi-line internal imports: import { ... } from './x.js';
    src = re.sub(
        r"import\s*\{[^}]*\}\s*from\s*['\"](\./|\.\./)[^'\"]+['\"];?\s*",
        "",
        src,
        flags=re.DOTALL,
    )
    # Single-line internal imports
    src = re.sub(
        r"^\s*import\s+[^;]*from\s+['\"](\./|\.\./)[^'\"]+['\"];?\s*$",
        "",
        src,
        flags=re.MULTILINE,
    )
    # Dexie CDN import — strip from all files; we add once at top of bundle.
    src = re.sub(
        r"^\s*import\s+Dexie\s+from\s+['\"]https?://[^'\"]+['\"];?\s*$",
        "",
        src,
        flags=re.MULTILINE,
    )
    # Strip `export ` keyword while preserving the declaration.
    src = re.sub(r"^export\s+", "", src, flags=re.MULTILINE)
    return src

def main() -> None:
    bundle_parts = []
    for rel in FILES_IN_ORDER:
        path = BASE / rel
        text = path.read_text()
        bundle_parts.append(f"\n/* ================== {rel} ================== */\n")
        bundle_parts.append(strip(text))

    bundle = "".join(bundle_parts)

    # db.js has `async function _loadValidators() { return await import('./events.js'); }`
    # which would break on file://. Replace with a synchronous return of the
    # validators already in scope.
    bundle = re.sub(
        r"async function _loadValidators\(\)\s*\{[^}]*\}",
        (
            "async function _loadValidators() {\n"
            "  return {\n"
            "    validatePerson, validateEvent, validateSource, validateMedia,\n"
            "    validateRelationship, validatePlace, validateHeirloom,\n"
            "  };\n"
            "}"
        ),
        bundle,
        flags=re.DOTALL,
    )

    html_shell = (BASE / "test-fixture.html").read_text()
    # Replace the external script tag with an inlined module script.
    html_shell = html_shell.replace(
        '<script type="module" src="./test-fixture.mjs"></script>',
        (
            '<script type="module">\n'
            "import Dexie from 'https://unpkg.com/dexie@4/dist/dexie.mjs';\n"
            + bundle
            + "\n</script>"
        ),
    )

    out = BASE / "test-fixture-standalone.html"
    out.write_text(html_shell)
    print(f"wrote {out} ({len(html_shell):,} bytes)")


if __name__ == "__main__":
    main()
