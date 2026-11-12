import test from 'node:test';
import assert from 'node:assert/strict';
import {getSpanishNov12TranslationCount} from '../spanish-nov12-translation-count.mjs';

test('conserver une aide comptée une seule fois par question traduite',()=>{
 const none=Array(10).fill(false);
 const two=Array(10).fill(false);two[0]=true;two[8]=true;
 assert.equal(getSpanishNov12TranslationCount('ESE_L14_01',none),0);
 assert.equal(getSpanishNov12TranslationCount('ESE_L14_02',two),2);
 assert.equal(getSpanishNov12TranslationCount('ESE_L14_03',Array(10).fill(true)),10);
});

test('ne rien changer pour les autres exercices',()=>{
 assert.equal(getSpanishNov12TranslationCount('ESE_L13_03',undefined),null);
 assert.equal(getSpanishNov12TranslationCount('MTH12_01',undefined),null);
});

test('refuser des indicateurs de traduction manquants ou falsifiés sur les exercices du 12 novembre',()=>{
 for(const flags of [undefined,[],[true],Array(10).fill(1),Array(11).fill(false)]){
  assert.throws(()=>getSpanishNov12TranslationCount('ESE_L14_01',flags));
 }
});
