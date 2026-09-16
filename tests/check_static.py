#!/usr/bin/env python3
"""Validate this static site without opening any external services. Python stdlib only."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import re

ROOT = Path(__file__).resolve().parents[1]
class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.ids=[];self.refs=[];self.h1=0;self.images=[];self.errors=[]
        self.feed(source)
    def handle_starttag(self, tag, attributes):
        a=dict(attributes)
        if a.get('id'): self.ids.append(a['id'])
        if tag=='h1':self.h1+=1
        if tag=='img':
            self.images.append(a)
            if 'alt' not in a:self.errors.append('Image is missing alt attribute')
        for key in ('href','src','data-home','data-person'):
            if a.get(key):self.refs.append(a[key])

paths=sorted(ROOT.rglob('*.html'))
docs={p:Document(p.read_text(encoding='utf-8')) for p in paths}
errors=[];refs=0;external=set();images=0
for path,doc in docs.items():
    name=str(path.relative_to(ROOT));images+=len(doc.images)
    errors.extend(f'{name}: {msg}' for msg in doc.errors)
    if doc.h1!=1:errors.append(f'{name}: expected one H1, found {doc.h1}')
    for ident,count in Counter(doc.ids).items():
        if count>1:errors.append(f'{name}: duplicate id {ident}')
    for raw in doc.refs:
        parsed=urlsplit(raw)
        if parsed.scheme in ('http','https') or parsed.netloc:
            external.add(raw);continue
        if parsed.scheme in ('mailto','tel','sms','data'):continue
        if parsed.scheme:errors.append(f'{name}: unexpected URI scheme: {raw}');continue
        target=(path.parent / unquote(parsed.path)).resolve() if parsed.path else path
        if parsed.path.startswith('/'):target=(ROOT / parsed.path.lstrip('/')).resolve()
        if target.is_dir():target=target/'index.html'
        refs+=1
        if not target.exists():errors.append(f'{name}: missing local target {raw}');continue
        if parsed.fragment and target in docs and unquote(parsed.fragment) not in docs[target].ids:
            errors.append(f'{name}: missing fragment {raw}')
    if not re.search(r'<meta[^>]+name="robots"',path.read_text()):
        errors.append(f'{name}: robots metadata missing')
summary={'html_files_checked':len(paths),'local_references_checked':refs,
    'image_elements_checked':images,'unique_external_links_not_submission_tested':len(external),
    'failures':errors,'status':'PASS' if not errors else 'FAIL'}
print(json.dumps(summary,indent=2))
raise SystemExit(1 if errors else 0)
