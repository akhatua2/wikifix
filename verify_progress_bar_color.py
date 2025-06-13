import sys

FILE = 'frontend/src/components/Hero.tsx'
EXPECTED = 'bg-[#2563eb]'
UNEXPECTED = 'bg-[#1ca152]'

with open(FILE) as f:
    content = f.read()

if EXPECTED in content and UNEXPECTED not in content:
    print('PASS: Progress bar is blue (#2563eb) and not green (#1ca152).')
    sys.exit(0)
else:
    print('FAIL: Progress bar color is incorrect.')
    sys.exit(1)

