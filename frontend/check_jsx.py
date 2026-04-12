import re
import sys

path = sys.argv[1] if len(sys.argv) > 1 else 'src/App.jsx'
# When run from frontend folder, default path is src/App.jsx

with open(path, 'r', encoding='utf-8') as f:
    s = f.read()

pairs = [
    ('(', ')'),
    ('{', '}'),
    ('[', ']'),
]

for a,b in pairs:
    print(f"{a}: {s.count(a)}    {b}: {s.count(b)}")

# Simple tag counts
tags = ['BrowserRouter', 'Routes', 'Route', 'Navigate']
for t in tags:
    open_tag = f"<{t}>"
    close_tag = f"</{t}>"
    opens = s.count(open_tag)
    closes = s.count(close_tag)
    print(f"{t}: opens={opens} closes={closes}")

# Count occurrences of '<Route' and self-closing '/>' and explicit '</Route>'
route_open = len(re.findall(r"<Route(\s|>)", s))
self_closing = s.count('/>')
route_close = s.count('</Route>')
print(f"<Route total open-like occurrences: {route_open}")
print(f"self-closing '/>' count: {self_closing}")
print(f"'</Route>' count: {route_close}")

# Show lines around potential mismatch: find last few lines
lines = s.splitlines()
for i,l in enumerate(lines[-60:], start=max(1, len(lines)-59)):
    print(f"{i:4}: {l}")
