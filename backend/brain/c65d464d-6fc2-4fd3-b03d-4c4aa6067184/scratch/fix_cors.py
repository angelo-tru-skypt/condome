import os
import re

def replace_cors(directory):
    pattern = re.compile(r'cors="http://localhost:3000"')
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    if pattern.search(content):
                        new_content = pattern.sub('cors="*"', content)
                        with open(path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Updated: {path}")
                except Exception as e:
                    print(f"Error processing {path}: {e}")

if __name__ == "__main__":
    base_dir = r"c:\Users\TheGoat\Desktop\project\backend\odoo\addons"
    replace_cors(base_dir)
