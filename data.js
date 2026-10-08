(function(){
  const base=[
    {id:1,title:'Casa Los Alerces 1450',place:'Las Condes',date:'Lun 13 oct',iso:'2025-10-13',time:'10:00',stage:'Vale Vista + formulario',person:'María González',status:'ATRASADO',due:'Venció hoy a las 14:00',photo:'1600585154340-be6161a56a0c',avatar:47,progress:42,documents:[['Bases del remate','PDF','APROBADO'],['Vale Vista','PDF','PENDIENTE'],['Formulario de postulación','DOCX','PENDIENTE']]},
    {id:2,title:'Depto. San Martín 588',place:'Santiago Centro',date:'Mar 14 oct',iso:'2025-10-14',time:'15:30',stage:'Emisión Vale Vista',person:'Juan Pérez',status:'ALERTA',due:'Vence en 18 h',photo:'1600607687939-ce8a6c25118c',avatar:12,progress:58,documents:[['Bases del remate','PDF','APROBADO'],['Vale Vista','PDF','EN REVISIÓN']]},
    {id:3,title:'Casa El Roble 972',place:'Ñuñoa',date:'Mié 15 oct',iso:'2025-10-15',time:'11:30',stage:'Ingreso a sala virtual',person:'Carla Rojas',status:'ALERTA',due:'Vence en 45 min',photo:'1600566753190-17f0baa2a6c3',avatar:32,progress:67,documents:[['Bases del remate','PDF','APROBADO'],['Mandato','PDF','APROBADO']]},
    {id:4,title:'Casa Valle Alegre 321',place:'La Florida',date:'Mié 15 oct',iso:'2025-10-15',time:'16:00',stage:'Documentación',person:'Diego Torres',status:'BIEN',due:'Vence mañana',photo:'1600047509807-ba8f99d2cdde',avatar:11,progress:74,documents:[['Bases del remate','PDF','APROBADO'],['Carpeta tributaria','PDF','EN REVISIÓN']]},
    {id:5,title:'Depto. Parque 1234',place:'Providencia',date:'Jue 16 oct',iso:'2025-10-16',time:'10:00',stage:'Preparación remate',person:'Andrea Silva',status:'BIEN',due:'Vence mañana',photo:'1600607687920-4e2a09cf159d',avatar:45,progress:82,documents:[['Bases del remate','PDF','APROBADO'],['Vale Vista','PDF','APROBADO']]},
    {id:6,title:'Casa Mirador 777',place:'Peñalolén',date:'Jue 16 oct',iso:'2025-10-16',time:'14:30',stage:'Revisión final',person:'Carlos Soto',status:'BIEN',due:'Vence mañana',photo:'1600585154526-990dced4db0d',avatar:15,progress:91,documents:[['Bases del remate','PDF','APROBADO'],['Informe legal','PDF','APROBADO']]},
    {id:7,title:'Terreno El Arrayán',place:'Lo Barnechea',date:'Vie 17 oct',iso:'2025-10-17',time:'12:00',stage:'Preparación de remate',person:'Paula Díaz',status:'BIEN',due:'Vence en 2 días',photo:'1500382017468-9049fed747ef',avatar:44,progress:86,documents:[['Bases del remate','PDF','APROBADO'],['Estudio de títulos','PDF','APROBADO']]}
  ];
  const saved=JSON.parse(localStorage.getItem('remates-demo-state')||'{}');
  const items=base.map(x=>({...x,...saved[x.id],img:`https://images.unsplash.com/photo-${x.photo}?auto=format&fit=crop&w=900&q=80`,avatarUrl:`https://i.pravatar.cc/80?img=${x.avatar}`}));
  function update(id,changes){const item=items.find(x=>x.id===Number(id));if(!item)return;Object.assign(item,changes);saved[id]={...(saved[id]||{}),...changes};localStorage.setItem('remates-demo-state',JSON.stringify(saved));window.dispatchEvent(new CustomEvent('remates:changed',{detail:item}));return item}
  function reset(){localStorage.removeItem('remates-demo-state');location.reload()}
  window.RematesData={items,update,reset};
})();
