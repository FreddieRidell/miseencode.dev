#!/bin/zsh

set -x

mkdir -p target/site
cp index.css target/site

echo "# Blog" > site/blog/index.md
for PAGE in site/blog/*.md ; do
  SLUG="$(PAGE:r)"
  echo $SLUG
  echo "* [$PAGE](${SLUG#*/})" >>  site/blog/index.md;
done

for PAGE in site/**/*.md ; do
  mkdir -p `dirname "target/$PAGE"`

  pandoc \
    --from markdown-markdown_in_html_blocks+raw_attribute \
    --standalone \
    --template=template.html \
    -i $PAGE \
    -o "target/${PAGE:r}.html" \
    &
done 

wait
