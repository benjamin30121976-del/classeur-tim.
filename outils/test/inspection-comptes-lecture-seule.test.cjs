'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {actionIsReadOnly,isTimWriteRequest}=require('../inspecter-comptes-lecture-seule.cjs');
test('seules les lectures get... sont autorisees',()=>{
  for(const action of ['getTimCourseContent','getParentReport','getMixedChallengePlan','getParentBonus'])
    assert.equal(actionIsReadOnly(action),true);
  for(const action of ['submitTimExercise','setParentCorrectionRelease','assignParentBonus','importMathPrivateQuiz','correctThalesNov16Question9','previewPhysicsTraining',''])
    assert.equal(actionIsReadOnly(action),false);
});
test('lectures API autorisees',()=>{
  assert.equal(isTimWriteRequest('POST','https://classeur-tim-v16.pages.dev/api/tim',JSON.stringify({action:'getTimCourseContent'})),false);
});
test('mutations API bloquees',()=>{
  for(const action of ['submitTimExercise','setParentCorrectionRelease','assignParentBonus','importMathPrivateQuiz'])
    assert.equal(isTimWriteRequest('POST','https://classeur-tim-v16.pages.dev/api/tim',JSON.stringify({action})),true);
  assert.equal(isTimWriteRequest('POST','https://classeur-tim-v16.pages.dev/api/tim','invalid'),true);
});
test('ecritures Firestore bloquees sans bloquer lecture',()=>{
  assert.equal(isTimWriteRequest('POST','https://firestore.googleapis.com/google.firestore.v1.Firestore/Write/channel',null),true);
  assert.equal(isTimWriteRequest('POST','https://firestore.googleapis.com/v1/projects/x/databases/(default)/documents:commit','{}'),true);
  assert.equal(isTimWriteRequest('POST','https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel',null),false);
});
