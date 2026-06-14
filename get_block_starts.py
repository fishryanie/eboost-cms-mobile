import json

with open("extracted_code.txt", "r") as f:
    lines = f.readlines()

for line in lines:
    if line.startswith("--- Code block"):
        print(line.strip())
    elif line.startswith("export type") or line.startswith("export interface") or line.startswith("export const"):
        print("  " + line.strip()[:100])
