const pages = {orders:'Заказы', clients:'Клиенты', batches:'Заявки', stats:'Статистика'};
const statuses = ['Создан','Принят','В производстве','Отправлен','Выдан','Отменён'];
const names = ['Анна Соколова','Михаил Волков','Елена Морозова','Олег Фомин','Мария Белова'];
const seed = names.map((client,i)=>({id:'MS-'+(1001+i), client, status:statuses[i], size:38+i,kind:'Анатомические',notes:'',batch:''}));
const key='mysole.demo.orders.v1';
let orders;
try { orders=JSON.parse(localStorage.getItem(key)) || seed; } catch {orders=seed;}
let editing, selected=new Set(), statusFilter='';
function elem(tag,content,cls){
  const el=document.createElement(tag);
  if(content!==undefined) el.textContent=content;
  if(cls) el.className=cls;
  return el;
}
function action(label,handler){
  const el=elem('button',label);
  el.onclick=handler;
  return el;
}
function persist(next){
  try {localStorage.setItem(key,JSON.stringify(next));orders=next;return true;}
  catch {notice.textContent='Сохранение недоступно. Проверьте настройки браузера.';return false;}
}
function edit(order){
  editing=order?.id;
  formTitle.textContent=editing?'Заказ '+editing:'Новый заказ';
  orderForm.reset();
  for(const field of ['client','size','kind','notes','leftExam','rightExam','correction']){
    if(order) orderForm.elements[field].value=order[field] ?? '';
  }
  clients.replaceChildren(...[...new Set(orders.map(o=>o.client))].map(n=>elem('option',n)));
  editor.showModal();
}
orderForm.onsubmit=e=>{
  e.preventDefault();
  const data=Object.fromEntries(new FormData(orderForm));
  data.client=data.client.trim();
  if(!data.client){notice.textContent='Введите имя клиента';return;}
  const next=editing?orders.map(o=>o.id===editing?{...o,...data}:o):[{...data,id:'MS-'+(Math.max(1000,...orders.map(o=>Number(o.id.slice(3))))+1),status:statuses[0],batch:''},...orders];
  if(persist(next)){editor.close();render();}
};
cancel.onclick=()=>editor.close();
add.onclick=()=>edit();
function render(){
  const page=Object.hasOwn(pages,location.hash.slice(1))?location.hash.slice(1):'orders';
  heading.textContent=pages[page];
  menu.replaceChildren(); filters.replaceChildren();records.replaceChildren();
  for(const [id,title] of Object.entries(pages)){
    const link=elem('a',title,id===page?'active':'');link.href='#'+id;menu.append(link);
  }
  add.hidden=page!=='orders';search.hidden=page==='stats';
  const q=search.value.trim().toLocaleLowerCase();
  const visible=orders.filter(o=>[o.client,o.id,o.batch].join(' ').toLocaleLowerCase().includes(q));
  if(page==='orders'){
    const sel=elem('select');sel.setAttribute('aria-label','Фильтр статусов');
    sel.append(elem('option','Все статусы'),...statuses.map(s=>elem('option',s)));
    sel.value=statusFilter||'Все статусы';
    sel.onchange=()=>{statusFilter=sel.selectedIndex?sel.value:'';render();};
    filters.append(sel);
    const send=action('Собрать заявку ('+selected.size+')',()=>{
      const batch='Заявка №'+(new Set(orders.map(o=>o.batch).filter(Boolean)).size+1);
      if(persist(orders.map(o=>selected.has(o.id)?{...o,batch}:o))){selected.clear();location.hash='batches';}
    });
    send.disabled=!selected.size;filters.append(send);
    for(const o of visible.filter(o=>!statusFilter||o.status===statusFilter)){
      const row=elem('div',undefined,'row'),check=elem('input');
      check.type='checkbox';check.disabled=Boolean(o.batch);check.checked=selected.has(o.id);check.setAttribute('aria-label','Выбрать '+o.id);
      check.onchange=()=>{if(check.checked)selected.add(o.id);else selected.delete(o.id);render();};
      const state=elem('select');state.setAttribute('aria-label','Статус '+o.id);state.append(...statuses.map(s=>elem('option',s)));state.value=o.status;
      state.onchange=()=>{persist(orders.map(item=>item.id===o.id?{...item,status:state.value}:item));render();};
      row.append(check,action(o.id,()=>edit(o)),elem('span',o.client),state);records.append(row);
    }
  }else if(page==='stats'){
    for(const s of ['Все заказы',...statuses]) records.append(elem('article',s+' · '+(s==='Все заказы'?orders.length:orders.filter(o=>o.status===s).length),'row'));
  }else{
    const prop=page==='clients'?'client':'batch';
    for(const name of new Set(visible.map(o=>o[prop]).filter(Boolean))){
      const details=elem('details',undefined,'row'),group=visible.filter(o=>o[prop]===name);
      details.append(elem('summary',name+' · '+group.length));
      for(const o of group) details.append(action(o.id+' · '+o.status,()=>edit(o)));
      records.append(details);
    }
  }
  if(!records.childElementCount) records.append(elem('p',page==='batches'&&!q?'Выберите заказы и нажмите «Собрать заявку».':'Записей не найдено.'));
}
search.oninput=render;
window.onhashchange=()=>{search.value='';notice.textContent='';render();};
render();

