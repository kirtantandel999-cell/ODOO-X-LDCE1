import os

def write_file(filepath, content):
    d = os.path.dirname(filepath)
    if d and not os.path.exists(d):
        os.makedirs(d, exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as out:
        out.write(content)
    print(f'Successfully wrote {filepath}')
