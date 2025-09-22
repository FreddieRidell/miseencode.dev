#!/bin/zsh

pandoc \
  --from markdown-markdown_in_html_blocks+raw_attribute \
  --standalone \
  --template=template.html \
  -i index.md \
  -o index.html \
  ;
