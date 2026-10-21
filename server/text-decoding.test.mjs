import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decodeBusinessText} from '../src/text-decoding.ts';
test('text decoding accepts strict UTF-8 and BOM-marked UTF-16 LE/BE without guessing',()=>{
 const text='Client,Amount\nCafé,£25';
 assert.equal(decodeBusinessText(new TextEncoder().encode(text)),text);
 const le=Buffer.concat([Buffer.from([255,254]),Buffer.from(text,'utf16le')]);
 assert.equal(decodeBusinessText(le),text);
 const be=Buffer.from(le);for(let i=0;i<be.length;i+=2){const b=be[i];be[i]=be[i+1];be[i+1]=b;}
 assert.equal(decodeBusinessText(be),text);
 for(const bytes of [[255,254,65],[254,255,0],[255,254,0,0,65,0,0,0],[0,0,254,255,0,0,0,65],[67,97,102,233]])
 assert.throws(()=>decodeBusinessText(Uint8Array.from(bytes)),/encoding/);
});
