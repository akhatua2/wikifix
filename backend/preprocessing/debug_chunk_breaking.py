from wikipedia_processor import WikipediaProcessor
from pathlib import Path

# Path to the Breaking Olympics HTML file
html_path = Path("/data1/akhatua/wikifix/backend/saved_site/en.wikipedia.org/wiki/Breaking_at_the_2024_Summer_Olympics.html")
output_path = html_path.with_suffix('.chunk_debug.txt')

processor = WikipediaProcessor()

with open(html_path, 'r', encoding='utf-8') as f:
    html_content = f.read()

chunks = processor.split_html_by_sentence(html_content)

with open(output_path, 'w', encoding='utf-8') as out:
    for i, chunk in enumerate(chunks, 1):
        out.write(f'--- Chunk {i} ---\n')
        out.write(chunk.strip() + '\n\n')

print(f"Wrote {len(chunks)} chunks to {output_path}") 