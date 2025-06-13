# Script to check if the Hero component uses the correct text

FILE = 'src/components/Hero.tsx'
OLD = 'Help Improve Wikipedia'
NEW = 'Help Fix Wikipedia'

with open(FILE, 'r') as f:
    content = f.read()

if OLD in content:
    print(f'ERROR: Found old string: {OLD}')
else:
    print(f'PASS: Old string not found.')

if NEW in content:
    print(f'PASS: Found new string: {NEW}')
else:
    print(f'ERROR: New string not found: {NEW}')

