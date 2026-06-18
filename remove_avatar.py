import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove avatar-card section
pattern = r'        <div class="avatar-card floating-card">.*?        </div>\n        <div class="hero-details'
replacement = '        <div class="hero-details'
new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Avatar removed successfully')
