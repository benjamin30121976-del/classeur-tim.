/* Choix explicite du mode de connexion, sans modification des autorisations Firebase. */
document.addEventListener('DOMContentLoaded',()=>{
 const form=document.getElementById('login-form');
 const label=document.getElementById('access-role-label');
 const email=document.getElementById('login-email');
 for(const [id,role] of [['choose-parent','Parent'],['choose-tim','Tim']]){
  document.getElementById(id)?.addEventListener('click',()=>{
   if(!form)return;
   form.hidden=false;
   label.textContent='Connexion sécurisée — '+role;
   email?.focus();
  });
 }
});