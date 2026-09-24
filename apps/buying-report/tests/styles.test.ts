import {expect,test} from 'bun:test';
test('timeline markers only decorate top-level history events',async()=>{
 const css=await Bun.file(new URL('../src/client/styles.css',import.meta.url)).text();
 expect(css).toContain('.test-findings li:before{content:none}');
});
