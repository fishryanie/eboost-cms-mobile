import html.parser
import sys

class CodeExtractor(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_code = False
        self.in_span_line = False
        self.code_blocks = []
        self.current_block = []

    def handle_starttag(self, tag, attrs):
        if tag == 'code':
            self.in_code = True
            self.current_block = []
        elif tag == 'span' and self.in_code:
            for attr in attrs:
                if attr[0] == 'class' and 'line' in attr[1]:
                    self.in_span_line = True

    def handle_endtag(self, tag):
        if tag == 'code':
            self.in_code = False
            self.code_blocks.append('\n'.join(self.current_block))
        elif tag == 'span' and self.in_code:
            self.in_span_line = False

    def handle_data(self, data):
        if self.in_span_line:
            self.current_block.append(data)

with open("/Users/mac/.gemini/antigravity-ide/brain/a597bb43-f39d-4b82-b2d3-1d06c900d6a7/.system_generated/steps/5/content.md", "r") as f:
    content = f.read()

parser = CodeExtractor()
parser.feed(content)

for i, code in enumerate(parser.code_blocks):
    print(f"--- Block {i} length {len(code)} ---")
    if len(code) > 0:
        print(code[:200])
        print("...")
