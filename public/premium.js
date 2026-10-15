(() => {
  const menuButton=document.querySelector('.dw-menu-button');
  const mobile=document.querySelector('.dw-mobile');
  const setMenu=open=>{if(!menuButton||!mobile)return;menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close navigation':'Open navigation');mobile.hidden=!open;};
  menuButton?.addEventListener('click',()=>setMenu(menuButton.getAttribute('aria-expanded')!=='true'));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuButton?.getAttribute('aria-expanded')==='true'){setMenu(false);menuButton.focus();}});
  mobile?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
  window.matchMedia('(min-width: 961px)').addEventListener('change',e=>{if(e.matches)setMenu(false)});
  document.querySelectorAll('[data-lead-form]').forEach(form=>{
    const status=form.querySelector('.dw-form-status');
    const submit=form.querySelector('[type="submit"]');
    let requestId='';let requestBody='';let busy=false;
    submit.disabled=false;
    const channel=form.elements.contactPreference;
    channel.value=form.dataset.kind==='patient'?'Phone':'Email';
    const syncContact=()=>{form.elements.email.required=channel.value==='Email';form.elements.phone.required=channel.value==='Phone';};
    syncContact();channel.addEventListener('change',syncContact);
    if(form.dataset.kind==='patient'&&new URLSearchParams(location.search).get('relationship')==='family')form.elements.relationship.value='family';
    form.addEventListener('submit',async e=>{
      e.preventDefault();if(busy||!form.reportValidity())return;
      const payload=Object.fromEntries(new FormData(form));payload.consent=form.elements.consent.checked;
      const body=JSON.stringify(payload);if(body!==requestBody){requestId=crypto.randomUUID();requestBody=body;}busy=true;
      submit.disabled=true;const label=submit.innerHTML;submit.textContent='Sending…';status.textContent='';status.classList.remove('is-error');
      try{
        const response=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':requestId},body});
        const result=await response.json();
        if(!response.ok||!result.ok)throw new Error(result.error||'We couldn’t send your request. Please try again.');
        form.querySelectorAll('input,select,button').forEach(x=>x.disabled=true);
        status.innerHTML='';const h=document.createElement('h3');h.textContent='Thank you. We’ve received your request.';const p=document.createElement('p');p.textContent=payload.kind==='patient'?'The Doppler team will contact you and guide you through the full intake.':payload.kind==='careers'?'The Doppler team will follow up with the full application and next steps.':'The Doppler team will reach out to discuss your community.';status.append(h,p);status.classList.add('is-success');status.focus();submit.textContent='Request received';
      }catch(err){status.textContent=err instanceof Error?err.message:'Something went wrong. Please try again.';status.classList.add('is-error');status.focus();submit.disabled=false;submit.innerHTML=label;busy=false;}
    });
  });
  const office=document.querySelector('.dw-office-leads');
  if(!office)return;
  const notice=document.querySelector('[data-office-config]');
  const status=document.querySelector('.dw-office-status');
  const filter=document.querySelector('[data-office-filter]');
  let leads=[];
  const formatDate=value=>new Date(value).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
  const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  const render=()=>{
    office.replaceChildren();const visible=leads.filter(x=>filter.value==='all'||x.kind===filter.value);
    if(!visible.length){office.append(make('p','dw-office-empty','No requests to show.'));return;}
    visible.forEach(lead=>{
      const item=make('article','dw-office-card');const top=make('div','dw-office-card-top');
      const titles={patient:'Patient request',careers:'Career interest',partner:'Community partnership'};
      top.append(make('span','dw-eyebrow',titles[lead.kind]||lead.kind),make('span','dw-office-badge',lead.status==='sent'?'Email sent':lead.status==='sending'?'Sending email':'Awaiting email'));
      const h=make('h3','',`${lead.firstName} ${lead.lastName}`);const date=make('p','dw-office-date',formatDate(lead.createdAt));
      const info=make('dl','dw-office-details');
      const fields={email:'Email',phone:'Phone',state:'State',contactPreference:'Preferred contact',relationship:'Requesting for',careFormat:'Care format',insurance:'Insurance plan',role:'Professional role',licenseState:'Licensure',community:'Community',jobTitle:'Role',residentCount:'Community size'};
      for(const [key,label] of Object.entries(fields)){if(lead[key])info.append(make('dt','',label),make('dd','',lead[key]));}
      const actions=make('div','dw-actions');const pdf=make('a','dw-text-link','Download PDF');pdf.href=lead.pdfUrl||`/api/office/leads/${encodeURIComponent(lead.id)}/pdf`;pdf.target='_blank';pdf.rel='noopener';pdf.insertAdjacentHTML('beforeend','<svg class="dw-arrow-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3.5 14.5 14.5 3.5M6 3.5h8.5V12" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>');actions.append(pdf);
      if(lead.status!=='sent'){const send=make('button','dw-button dw-button-small','Send PDF to team');send.type='button';send.disabled=!leads.deliveryConfigured;send.addEventListener('click',async()=>{send.disabled=true;status.textContent='Sending PDF…';try{const r=await fetch(`/api/office/leads/${encodeURIComponent(lead.id)}/send`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||'Email delivery failed.');status.textContent=d.delivery==='sent'?'PDF email sent.':'Request remains queued.';await load();}catch(e){status.textContent=e.message;send.disabled=false;}});actions.append(send);}
      item.append(top,h,date,info,actions);office.append(item);
    });
  };
  const load=async()=>{
    status.textContent='Loading requests…';
    try{const r=await fetch('/api/office/leads');const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||'Please sign in with an authorized office account.');leads=d.leads;leads.deliveryConfigured=d.deliveryConfigured;notice.textContent=d.deliveryConfigured?'PDF emails are configured for team@dopplerwellness.com.':'Email delivery is awaiting configuration. Requests are saved here and PDFs can be downloaded. All PDF emails will go to team@dopplerwellness.com.';status.textContent='';render();}
    catch(e){status.textContent=e.message;notice.textContent='Office access is restricted to authorized accounts.';}
  };
  filter.addEventListener('change',render);document.querySelector('[data-office-refresh]').addEventListener('click',load);load();
})();
