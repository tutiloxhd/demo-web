(function(){
  const base=[
    {id:1,gestorId:'u2',postorId:'u4',minimum:420,title:'Casa Los Alerces 1450',place:'Las Condes',date:'Lun 13 oct',iso:'2025-10-13',time:'10:00',stage:'Entregar Vale Vista + formulario',status:'ATRASADO',due:'Venció hoy a las 14:00',dueAt:'2025-10-16T14:00',photo:'1600585154340-be6161a56a0c',flowStage:9,progress:53,documents:[['Bases del remate','PDF','APROBADO'],['Vale Vista','PDF','PENDIENTE'],['Formulario de postulación','DOCX','PENDIENTE']]},
    {id:2,gestorId:'u3',postorId:'u7',minimum:95,title:'Depto. San Martín 588',place:'Santiago Centro',date:'Mar 14 oct',iso:'2025-10-14',time:'15:30',stage:'Enviar carta al banco',status:'ALERTA',due:'Vence en 18 h',dueAt:'2025-10-17T12:00',photo:'1600607687939-ce8a6c25118c',flowStage:5,progress:27,documents:[['Bases del remate','PDF','APROBADO'],['Vale Vista','PDF','EN REVISIÓN']]},
    {id:3,gestorId:'u6',postorId:'u4',minimum:310,title:'Casa El Roble 972',place:'Ñuñoa',date:'Mié 15 oct',iso:'2025-10-15',time:'11:30',stage:'Ingresar a sala virtual',status:'ALERTA',due:'Vence en 45 min',dueAt:'2025-10-16T18:45',photo:'1600566753190-17f0baa2a6c3',flowStage:13,progress:80,documents:[['Bases del remate','PDF','APROBADO'],['Mandato','PDF','APROBADO']]},
    {id:4,gestorId:'u2',postorId:'u4',minimum:180,title:'Casa Valle Alegre 321',place:'La Florida',date:'Mié 15 oct',iso:'2025-10-15',time:'16:00',stage:'Generar formulario',status:'BIEN',due:'Vence mañana',dueAt:'2025-10-17T16:00',photo:'1600047509807-ba8f99d2cdde',flowStage:6,progress:33,documents:[['Bases del remate','PDF','APROBADO'],['Carpeta tributaria','PDF','EN REVISIÓN']]},
    {id:5,gestorId:'u3',postorId:'u7',minimum:240,title:'Depto. Parque 1234',place:'Providencia',date:'Jue 16 oct',iso:'2025-10-16',time:'10:00',stage:'Preparar participación',status:'BIEN',due:'Vence mañana',dueAt:'2025-10-17T10:00',photo:'1600607687920-4e2a09cf159d',flowStage:12,progress:73,documents:[['Bases del remate','PDF','APROBADO'],['Vale Vista','PDF','APROBADO']]},
    {id:6,gestorId:'u6',postorId:'u7',minimum:350,title:'Casa Mirador 777',place:'Peñalolén',date:'Jue 16 oct',iso:'2025-10-16',time:'14:30',stage:'Revisión legal final',status:'BIEN',due:'Vence mañana',dueAt:'2025-10-17T14:30',photo:'1600585154526-990dced4db0d',flowStage:11,progress:67,documents:[['Bases del remate','PDF','APROBADO'],['Informe legal','PDF','APROBADO']]},
    {id:7,gestorId:'u2',postorId:'u4',minimum:520,title:'Terreno El Arrayán',place:'Lo Barnechea',date:'Vie 17 oct',iso:'2025-10-17',time:'12:00',stage:'Preparar participación',status:'BIEN',due:'Vence en 2 días',dueAt:'2025-10-18T12:00',photo:'1500382017468-9049fed747ef',flowStage:12,progress:73,documents:[['Bases del remate','PDF','APROBADO'],['Estudio de títulos','PDF','APROBADO']]},
    {id:8,gestorId:'u3',postorId:'u7',minimum:610,title:'Casa Las Hualtatas 5210',place:'Vitacura',date:'Mar 14 oct',iso:'2025-10-14',time:'11:00',stage:'Revisión legal pre-entrega',status:'SUSPENDIDO',due:'Suspendido por revisión legal',flowStage:7,photo:'1568605114967-8130f3a36994',progress:40,documents:[['Bases del remate','PDF','APROBADO'],['Informe legal','PDF','EN REVISIÓN']]},
    {id:9,gestorId:'u6',postorId:'u4',minimum:130,title:'Depto. Los Leones 890',place:'Providencia',date:'Vie 17 oct',iso:'2025-10-17',time:'09:30',stage:'Revisión legal final',status:'CANCELADO',due:'Cancelado por revisión legal',flowStage:11,photo:'1512917774080-9991f1c4c750',progress:67,documents:[['Bases del remate','PDF','APROBADO'],['Vale Vista','PDF','APROBADO'],['Informe legal','PDF','PENDIENTE']]},
    {id:10,gestorId:'u2',postorId:'u7',minimum:780,title:'Casa Los Trapenses 2140',place:'Lo Barnechea',date:'Lun 20 oct',iso:'2025-10-20',time:'10:30',stage:'Generar carta Vale Vista',status:'BIEN',due:'Vence en 4 días',dueAt:'2025-10-20T10:30',flowStage:3,photo:'1570129477492-45c003edd2be',progress:13,documents:[['Bases del remate','PDF','APROBADO'],['Carta Vale Vista','DOCX','PENDIENTE']]},
    {id:11,gestorId:'u3',postorId:'u4',minimum:110,title:'Depto. Irarrázaval 3050',place:'Ñuñoa',date:'Mar 21 oct',iso:'2025-10-21',time:'12:00',stage:'Enviar carta al banco',status:'ALERTA',due:'Vence en 20 h',dueAt:'2025-10-17T14:00',flowStage:5,photo:'1493809842364-78817add7ffb',progress:27,documents:[['Bases del remate','PDF','APROBADO'],['Carta Vale Vista','PDF','EN REVISIÓN']]},
    {id:12,minimum:890,title:'Casa Camino El Alba 9120',place:'Las Condes',date:'Mié 22 oct',iso:'2025-10-22',time:'09:00',stage:'Asignar gestor y postor',status:'ATRASADO',due:'Venció ayer',dueAt:'2025-10-15T09:00',flowStage:2,photo:'1564013799919-ab600027ffc6',progress:7,documents:[['Bases del remate','PDF','EN REVISIÓN']]},
    {id:13,gestorId:'u6',postorId:'u7',minimum:260,title:'Parcela Chicureo 18',place:'Colina',date:'Mié 22 oct',iso:'2025-10-22',time:'15:00',stage:'Generar formulario',status:'BIEN',due:'Vence en 3 días',dueAt:'2025-10-19T15:00',flowStage:6,photo:'1580587771525-78b9dba3b914',progress:33,documents:[['Bases del remate','PDF','APROBADO'],['Carta Vale Vista','PDF','APROBADO']]},
    {id:14,gestorId:'u2',postorId:'u4',minimum:85,title:'Depto. Av. Matta 455',place:'Santiago Centro',date:'Jue 23 oct',iso:'2025-10-23',time:'11:00',stage:'Enviar carta al GG',status:'BIEN',due:'Vence en 5 días',dueAt:'2025-10-21T11:00',flowStage:4,photo:'1512918728675-ed5a9ecdebfd',progress:20,documents:[['Bases del remate','PDF','APROBADO'],['Carta Vale Vista','DOCX','PENDIENTE']]},
    {id:15,gestorId:'u3',postorId:'u7',minimum:640,title:'Casa Los Dominicos 730',place:'Las Condes',date:'Vie 24 oct',iso:'2025-10-24',time:'16:30',stage:'Revisión legal pre-entrega',status:'ALERTA',due:'Vence mañana',dueAt:'2025-10-17T16:30',flowStage:7,photo:'1613490493576-7fde63acd811',progress:40,documents:[['Bases del remate','PDF','APROBADO'],['Carta Vale Vista','PDF','APROBADO'],['Formulario de postulación','DOCX','EN REVISIÓN']]},
    {id:16,gestorId:'u6',postorId:'u4',minimum:330,awarded:365,title:'Casa Pedro de Valdivia 2480',place:'Providencia',date:'Lun 6 oct',iso:'2025-10-06',time:'10:00',stage:'Workflow completado',status:'BIEN',due:'Workflow completado',flowStage:16,resultOutcome:'ADJUDICADO',resultTasks:{'17A':true,'18A':true,'19A':true},photo:'1600596542815-ffad4c1539a9',progress:100,documents:[['Bases del remate','PDF','APROBADO'],['Vale Vista','PDF','APROBADO'],['Acta de adjudicación','PDF','APROBADO']]},
    {id:17,gestorId:'u2',postorId:'u7',minimum:140,title:'Depto. Manuel Montt 1120',place:'Providencia',date:'Mar 7 oct',iso:'2025-10-07',time:'12:30',stage:'Workflow completado',status:'BIEN',due:'Workflow completado',flowStage:16,resultOutcome:'NO_ADJUDICADO',resultTasks:{'17B':true,'18B':true},photo:'1605276374104-dee2a0ed3cd6',progress:100,documents:[['Bases del remate','PDF','APROBADO'],['Vale Vista','PDF','APROBADO']]},
    {id:18,gestorId:'u3',postorId:'u4',minimum:150,title:'Casa Quilín 6045',place:'Macul',date:'Mié 8 oct',iso:'2025-10-08',time:'11:00',stage:'Registrar resultado',status:'ALERTA',due:'Garantía por recuperar',dueAt:'2025-10-17T18:00',flowStage:16,resultOutcome:'NO_ADJUDICADO',resultPriorStatus:'ALERTA',resultTasks:{},photo:'1518780664697-55e3ad937233',progress:94,documents:[['Bases del remate','PDF','APROBADO'],['Vale Vista','PDF','APROBADO']]},
    {id:19,gestorId:'u6',postorId:'u7',minimum:920,awarded:1010,title:'Casa Santa María de Manquehue 310',place:'Vitacura',date:'Jue 9 oct',iso:'2025-10-09',time:'15:30',stage:'Registrar resultado',status:'ALERTA',due:'Pendiente de completar resultado',dueAt:'2025-10-17T12:00',flowStage:16,resultOutcome:'ADJUDICADO',resultPriorStatus:'ALERTA',resultTasks:{'17A':true},photo:'1568605114967-8130f3a36994',progress:95,documents:[['Bases del remate','PDF','APROBADO'],['Vale Vista','PDF','APROBADO'],['Acta de adjudicación','PDF','EN REVISIÓN']]},
    {id:20,gestorId:'u2',postorId:'u4',minimum:210,title:'Depto. Bilbao 3771',place:'Las Condes',date:'Vie 10 oct',iso:'2025-10-10',time:'09:30',stage:'Registrar resultado',status:'ALERTA',due:'Pendiente de completar resultado',dueAt:'2025-10-20T09:30',flowStage:16,resultOutcome:'REPROGRAMADO',resultPriorStatus:'ALERTA',resultTasks:{'17C':true},photo:'1512917774080-9991f1c4c750',progress:95,documents:[['Bases del remate','PDF','APROBADO'],['Vale Vista','PDF','APROBADO']]}
  ];
  const saved=JSON.parse(localStorage.getItem('remates-demo-state')||'{}');
  const items=base.map(x=>({...x,...saved[x.id],img:`https://images.unsplash.com/photo-${x.photo}?auto=format&fit=crop&w=900&q=80`}));
  function update(id,changes){const item=items.find(x=>x.id===Number(id));if(!item)return;Object.assign(item,changes);saved[id]={...(saved[id]||{}),...changes};syncPerson(item);localStorage.setItem('remates-demo-state',JSON.stringify(saved));window.dispatchEvent(new CustomEvent('remates:changed',{detail:item}));return item}
  function reset(){['remates-demo-state','remates-demo-users','inmoremates-demo-tasks','inmoremates-demo-users'].forEach(key=>localStorage.removeItem(key));location.reload()}
  // Workflow compartido: los 15 pasos y las ramas de resultado, con el rol que responde por cada tarea.
  // Roles: admin (asignador, gerente general y pasos del sistema), gestor, postor y legal.
  const STEPS=[
    {title:'Crear workflow',role:'admin',type:'Gestión',desc:'Al aceptar la propiedad se crea el workflow del remate.'},
    {title:'Asignar gestor y postor',role:'admin',type:'Gestión',desc:'Definir quién gestiona el remate y quién participa como postor.'},
    {title:'Generar carta Vale Vista',role:'admin',type:'Vale Vista',desc:'Generar la carta para solicitar el Vale Vista.'},
    {title:'Enviar carta al GG',role:'admin',type:'Vale Vista',desc:'Enviar la carta por email, con el adjunto, al gerente general.'},
    {title:'Enviar carta al banco',role:'admin',type:'Vale Vista',desc:'El gerente general envía la carta al banco desde su buzón.'},
    {title:'Generar formulario',role:'gestor',type:'Documentación',desc:'Generar el formulario que se entrega junto al Vale Vista.'},
    {title:'Revisión legal pre-entrega',role:'legal',type:'Legal',desc:'Revisión legal previa a la entrega. Legal puede suspender o cancelar el remate.'},
    {title:'Retirar Vale Vista',role:'gestor',type:'Vale Vista',desc:'Retirar el Vale Vista en el banco.'},
    {title:'Entregar Vale Vista + formulario',role:'gestor',type:'Documentación',desc:'Entregar el Vale Vista y el formulario en el juzgado.'},
    {title:'Registrar evidencia',role:'gestor',type:'Documentación',desc:'Registrar las fotos timbradas como evidencia de la entrega.'},
    {title:'Revisión legal final',role:'legal',type:'Legal',desc:'Revisión legal final antes del remate. Legal puede suspender o cancelar el remate.'},
    {title:'Preparar participación',role:'postor',type:'Participación',desc:'Dejar listos el link de la sala y el monto para participar.'},
    {title:'Ingresar a sala virtual',role:'postor',type:'Participación',desc:'Ingresar a la sala virtual, como máximo 15 minutos antes.'},
    {title:'Participar en remate',role:'postor',type:'Participación',desc:'Participar en el remate.'},
    {title:'Registrar resultado',role:'postor',type:'Participación',desc:'Registrar el resultado del remate.'}
  ];
  // Cada tarea de rama: [clave, título, detalle, rol].
  const BRANCHES={
    ADJUDICADO:{title:'ADJUDICADO',description:'Ganamos el remate',tasks:[['17A','Gestionar pago','Mecanismo por definir','gestor'],['18A','Marcar adjudicada','Usuario autorizado','admin'],['19A','Crear proyecto','Sistema o usuario','admin']]},
    NO_ADJUDICADO:{title:'NO ADJUDICADO',description:'Participamos, no ganamos',tasks:[['17B','Recuperar garantía','Gestor, por confirmar','gestor'],['18B','Registrar garantía','Monto, banco, N° VV','gestor']]},
    REPROGRAMADO:{title:'REPROGRAMADO',description:'Nueva fecha de remate',tasks:[['17C','Actualizar fecha','Queda en historial','admin'],['17D','Recalcular plazos','Vencimientos y alertas','admin'],['17E','Continuar workflow','Vuelve a la etapa vigente','admin']]}
  };

  // Usuarios: son los responsables de los remates. Los administra el Gestor de usuarios.
  const USER_KEY='remates-demo-users';
  const USER_ROLES={'Administrador':'admin','Gestor de remates':'gestor','Responsable de participación':'postor','Responsable de revisión legal':'legal'};
  const DEFAULT_USERS=[
    {id:'u1',name:'María González',email:'maria.gonzalez@grupohouse.cl',role:'Administrador',team:'Dirección',active:true,avatar:'https://i.pravatar.cc/80?img=47'},
    {id:'u2',name:'Juan Pérez',email:'juan.perez@grupohouse.cl',role:'Gestor de remates',team:'Gestión',active:true,avatar:'https://i.pravatar.cc/80?img=12'},
    {id:'u3',name:'Carla Rojas',email:'carla.rojas@grupohouse.cl',role:'Gestor de remates',team:'Gestión',active:true,avatar:'https://i.pravatar.cc/80?img=32'},
    {id:'u4',name:'Diego Torres',email:'diego.torres@grupohouse.cl',role:'Responsable de participación',team:'Participación',active:true,avatar:'https://i.pravatar.cc/80?img=11'},
    {id:'u5',name:'Paula Díaz',email:'paula.diaz@grupohouse.cl',role:'Responsable de revisión legal',team:'Legal',active:false,avatar:'https://i.pravatar.cc/80?img=44'},
    {id:'u6',name:'Andrea Silva',email:'andrea.silva@grupohouse.cl',role:'Gestor de remates',team:'Gestión',active:true,avatar:'https://i.pravatar.cc/80?img=45'},
    {id:'u7',name:'Carlos Soto',email:'carlos.soto@grupohouse.cl',role:'Responsable de participación',team:'Participación',active:true,avatar:'https://i.pravatar.cc/80?img=15'},
    {id:'u8',name:'Felipe Morales',email:'felipe.morales@grupohouse.cl',role:'Responsable de revisión legal',team:'Legal',active:true,avatar:'https://i.pravatar.cc/80?img=53'}
  ];
  const savedUsers=JSON.parse(localStorage.getItem(USER_KEY)||'null');
  let users=Array.isArray(savedUsers)&&savedUsers.length?savedUsers:JSON.parse(JSON.stringify(DEFAULT_USERS));
  function saveUsers(list){users=list;localStorage.setItem(USER_KEY,JSON.stringify(users));items.forEach(syncPerson)}

  const stageOf=item=>Math.min(16,Math.max(1,Number(item.flowStage)||1));
  const isStopped=item=>item.status==='SUSPENDIDO'||item.status==='CANCELADO';
  const isFinished=item=>{const branch=BRANCHES[item.resultOutcome];return Boolean(branch)&&branch.tasks.every(([key])=>(item.resultTasks||{})[key])};
  const stepTask=n=>({key:'s'+n,step:n,title:STEPS[n-1].title,desc:STEPS[n-1].desc,role:STEPS[n-1].role,type:STEPS[n-1].type});
  const branchTask=([key,title,desc,role])=>({key,title,desc,role,type:'Cierre'});

  // Tarea que hay que hacer ahora en un remate; null si está terminado o cancelado.
  function currentTask(item){
    if(item.status==='CANCELADO'||isFinished(item))return null;
    if(stageOf(item)<=15)return stepTask(stageOf(item));
    const branch=BRANCHES[item.resultOutcome];
    if(!branch)return{key:'result',title:'Elegir resultado del remate',desc:'Registrar si el remate fue adjudicado, no adjudicado o reprogramado. Se hace desde el flujo del remate.',role:'postor',type:'Cierre',needsBoard:true};
    return branchTask(branch.tasks.find(([key])=>!(item.resultTasks||{})[key]));
  }
  // Última tarea completada de un remate; null si todavía no se completa ninguna.
  function lastDoneTask(item){
    const done=(BRANCHES[item.resultOutcome]||{tasks:[]}).tasks.filter(([key])=>(item.resultTasks||{})[key]);
    if(done.length)return branchTask(done[done.length-1]);
    return stageOf(item)>1?stepTask(stageOf(item)-1):null;
  }
  // Quién responde por un rol en un remate: su gestor o postor asignado (aunque esté inactivo, hasta que se reasigne)
  // o, si no hay, el primer usuario activo de ese rol; sin nadie activo en el rol, un administrador activo.
  function userForRole(item,role){
    const active=r=>users.find(u=>u.active&&USER_ROLES[u.role]===r);
    const own=users.find(u=>u.id===(role==='gestor'?item.gestorId:role==='postor'?item.postorId:null));
    return own||active(role)||active('admin')||users.find(u=>USER_ROLES[u.role]===role)||users[0];
  }
  // Responsable de una tarea: el reasignado a mano (taskNotes) o el que corresponde por rol.
  function taskUser(item,task){
    const note=(item.taskNotes||{})[task.key]||{};
    return users.find(u=>u.id===note.assignedUserId)||userForRole(item,task.role);
  }
  // El responsable que muestra el tablero es el de la tarea actual.
  function syncPerson(item){
    const task=currentTask(item);
    const user=task?taskUser(item,task):userForRole(item,item.status==='CANCELADO'?'legal':'gestor');
    item.person=user.name;item.avatarUrl=user.avatar;item.responsibleId=user.id;
  }

  // Cambios que produce completar el paso actual (1 a 15); null si no se puede.
  function stepChanges(item){
    const current=stageOf(item);
    if(current>15||isStopped(item))return null;
    const next=current+1,reached=next>15;
    return{flowStage:next,status:item.status==='ATRASADO'?'ATRASADO':'ALERTA',stage:reached?'Registrar resultado':STEPS[next-1].title,due:reached?'Pendiente de completar resultado':item.due,progress:reached?94:Math.round(current/15*100)};
  }
  // Cambios que produce marcar o desmarcar una tarea de la rama de resultado elegida; null si no se puede.
  function resultTaskChanges(item,taskId,checked){
    const branch=BRANCHES[item.resultOutcome];
    if(!branch||stageOf(item)<15||isStopped(item)||!branch.tasks.some(([key])=>key===taskId))return null;
    const resultTasks={...(item.resultTasks||{}),[taskId]:Boolean(checked)};
    const done=branch.tasks.filter(([key])=>resultTasks[key]).length,complete=done===branch.tasks.length;
    return{resultTasks,status:complete?'BIEN':item.status==='ATRASADO'||item.resultPriorStatus==='ATRASADO'?'ATRASADO':'ALERTA',stage:complete?'Workflow completado':'Registrar resultado',due:complete?'Workflow completado':'Pendiente de completar resultado',progress:complete?100:94+Math.floor(done/branch.tasks.length*5)};
  }
  // Completa la tarea actual de un remate. Elegir el resultado no pasa por aquí: se hace en el flujo del remate.
  function completeCurrent(id){
    const item=items.find(x=>x.id===Number(id)),task=item&&currentTask(item);
    if(!task||task.needsBoard||isStopped(item))return null;
    const changes=task.step?stepChanges(item):resultTaskChanges(item,task.key,true);
    return changes?update(id,changes):null;
  }
  items.forEach(syncPerson);

  // Semana visible, compartida entre pantallas durante la sesión. La semana 0 es la del lunes 13 de octubre de 2025.
  const WEEK_KEY='remates-demo-week',MONTHS=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'],DAYS=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const isoDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const clampWeek=n=>Math.max(-1,Math.min(2,Number(n)||0));
  function weekRange(offset){const day=n=>new Date(2025,9,13+offset*7+n),monday=day(0),friday=day(4);const from=monday.getMonth()===friday.getMonth()?monday.getDate():`${monday.getDate()} ${MONTHS[monday.getMonth()]}`;return{from:isoDate(monday),to:isoDate(day(6)),label:`Semana del ${from} al ${friday.getDate()} ${MONTHS[friday.getMonth()]} ${friday.getFullYear()}`,days:[0,1,2,3,4].map(n=>({iso:isoDate(day(n)),name:DAYS[day(n).getDay()],num:day(n).getDate()}))}}
  function weekItems(offset){const range=weekRange(offset);return items.filter(x=>x.iso>=range.from&&x.iso<=range.to)}
  function getWeek(){return clampWeek(sessionStorage.getItem(WEEK_KEY))}
  function setWeek(n){const week=clampWeek(n);sessionStorage.setItem(WEEK_KEY,week);return week}
  window.RematesData={items,update,reset,weekRange,weekItems,getWeek,setWeek,steps:STEPS,branches:BRANCHES,userRoles:USER_ROLES,users:()=>users,saveUsers,currentTask,lastDoneTask,taskUser,stepChanges,resultTaskChanges,completeCurrent};
})();
