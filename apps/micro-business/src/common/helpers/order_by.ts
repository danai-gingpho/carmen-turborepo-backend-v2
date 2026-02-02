
export default function order(sort: string[]) {  
  return Array.isArray(sort) && sort.length
    ? sort.map((s) => {        
        if (typeof s === 'string') {
          const parts = s.includes(':') ? s.split(':') : s.split(' ');
          const field = parts[0];
          const dir = parts[1] ? parts[1].toLowerCase() : 'asc';
          return { [field]: dir === 'desc' ? 'desc' : 'asc' } as any;
        }
        return s as any;
      })
    : undefined;
}
