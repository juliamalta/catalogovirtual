// A query-boundary test double, not a PostgreSQL emulator or proof of SQL constraints.
async function createMemoryDatabase(seed={}){
 const {PgDialect,PgTable}=await import('drizzle-orm/pg-core');
 const {getTableName,getTableColumns,is}=await import('drizzle-orm');
 const crypto=await import('node:crypto');const dialect=new PgDialect();
 let data=structuredClone(seed);const registry={};const locks=[];
 const tableName=table=>{const name=getTableName(table);registry[name]=table;return name};
 const cell=(joined,name,column)=>{const table=registry[name];const key=Object.keys(getTableColumns(table)).find(key=>table[key]?.name===column);return joined[name]?.[key]};
 function matches(condition,joined){if(!condition)return true;const query=dialect.sqlToQuery(condition);if(query.sql.trim()==='false')return false;let valid=true;
  const equality=/"([\w]+)"\."([\w]+)"\s*=\s*(?:\$(\d+)|"([\w]+)"\."([\w]+)")/g;let m;while((m=equality.exec(query.sql))){const right=m[3]?query.params[Number(m[3])-1]:cell(joined,m[4],m[5]);valid=valid&&cell(joined,m[1],m[2])===right}
  const inside=/"([\w]+)"\."([\w]+)"\s+in\s*\(([^)]+)\)/gi;while((m=inside.exec(query.sql))){const values=[...m[3].matchAll(/\$(\d+)/g)].map(x=>query.params[Number(x[1])-1]);valid=valid&&values.includes(cell(joined,m[1],m[2]))}return valid;
 }
 function project(value,joined){if(is(value,PgTable))return joined[tableName(value)]??null;if(value?.table&&value?.name)return cell(joined,tableName(value.table),value.name);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,project(v,joined)]));return value}
 function builder(mode,selection,table){let filter,maximum=Infinity,values,patch,returning=false,conflict;const joins=[];let result,done=false;
  const b={from(t){table=t;tableName(t);return b},innerJoin(t,c){tableName(t);joins.push({table:t,condition:c,left:false});return b},leftJoin(t,c){tableName(t);joins.push({table:t,condition:c,left:true});return b},where(c){filter=c;return b},limit(n){maximum=n;return b},orderBy(){return b},for(strength){locks.push({table:tableName(table),strength});return b},values(v){values=v;return b},set(v){patch=v;return b},returning(s){returning=true;selection=s;return b},onConflictDoUpdate(c){conflict=c;return b},then(resolve,reject){try{return Promise.resolve(exec()).then(resolve,reject)}catch(e){return Promise.reject(e).then(resolve,reject)}}};
  function exec(){if(done)return result;done=true;const name=tableName(table);data[name]??=[];
   if(mode==='select'){let joined=data[name].map(row=>({[name]:row}));for(const join of joins){const n=tableName(join.table);joined=joined.flatMap(row=>{const found=(data[n]||[]).map(other=>({...row,[n]:other})).filter(item=>matches(join.condition,item));return found.length?found:join.left?[{...row,[n]:null}]:[]})}joined=joined.filter(row=>matches(filter,row)).slice(0,maximum);result=joined.map(row=>selection?project(selection,row):structuredClone(row[name]));return result}
   if(mode==='insert'){const inserted=[];for(const value of(Array.isArray(values)?values:[values])){const targetKey=conflict?Object.entries(getTableColumns(table)).find(([,col])=>col===conflict.target)?.[0]:null;const previous=targetKey?data[name].find(row=>row[targetKey]===value[targetKey]):null;if(previous){Object.assign(previous,conflict.set);inserted.push(previous);continue}const row={id:crypto.randomUUID(),createdAt:new Date(),updatedAt:new Date(),description:'',isActive:true,isFeatured:false,sortOrder:0,categoryId:null,status:'DRAFT',logoUrl:null,coverUrl:null,availabilityMode:'ALWAYS',optionGroup:'Opção',primaryColor:'#2563eb',secondaryColor:'#f8fafc',deliveryEnabled:false,pickupEnabled:true,...structuredClone(value)};data[name].push(row);inserted.push(row)}result=returning?inserted.map(row=>selection?project(selection,{[name]:row}):structuredClone(row)):[];return result}
   const selected=data[name].filter(row=>matches(filter,{[name]:row}));if(mode==='update')selected.forEach(row=>Object.assign(row,structuredClone(patch)));if(mode==='delete')data[name]=data[name].filter(row=>!selected.includes(row));result=returning?selected.map(row=>selection?project(selection,{[name]:row}):structuredClone(row)):[];return result;
  }return b;
 }
 const db={execute:async()=>({rows:[{available:false}]}),select:s=>builder('select',s),insert:t=>builder('insert',null,t),update:t=>builder('update',null,t),delete:t=>builder('delete',null,t),async transaction(fn){if(db.beforeTransaction)await db.beforeTransaction();const before=structuredClone(data);try{return await fn(db)}catch(e){data=before;throw e}},beforeTransaction:null,locks,rows:name=>data[name]||[],snapshot:()=>structuredClone(data)};return db;
}
module.exports={createMemoryDatabase};
