from pathlib import Path
import json,re
root=Path(__file__).resolve().parent.parent
p=root/'js/wedding-config.js'
s=p.read_text(encoding='utf-8-sig')
assets=sorted(x.relative_to(root).as_posix() for x in (root/'assets').rglob('*') if x.is_file())
s=re.sub(r'availableAssets:\s*\[[^\]]*\]', 'availableAssets: '+json.dumps(assets), s)
p.write_text(s,encoding='utf-8')
print('Asset inventory updated:',len(assets),'files')
