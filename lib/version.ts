// @/lib/version.ts

export const compareVersions = (current: string, latest: string): number => {
  const parse = (v: string) => {
    // 1. Determina o peso da versão
    let weight = 3; // Oficial (padrão)
    let suffixIndex = 0;

    if (v.includes('rc')) {
      weight = 2; // RC tem peso intermediário
      suffixIndex = parseInt(v.split('rc')[1]) || 0;
    } else if (v.includes('b')) {
      weight = 1; // Beta tem peso menor
      suffixIndex = parseInt(v.split('b')[1]) || 0;
    }

    // 2. Extrai a base da versão (1.0.12)
    // Remove qualquer sufixo para pegar apenas os números
    const base = v.split(/b|rc/)[0]; 
    const [major, minor, patch] = base.split('.').map(Number);
    
    return { major, minor, patch, weight, suffixIndex };
  };

  const c = parse(current);
  const l = parse(latest);

  // 3. Comparações hierárquicas
  if (c.major !== l.major) return c.major < l.major ? 1 : -1;
  if (c.minor !== l.minor) return c.minor < l.minor ? 1 : -1;
  if (c.patch !== l.patch) return c.patch < l.patch ? 1 : -1;
  
  // Se a versão base for igual, compara o peso (Oficial > RC > Beta)
  if (c.weight !== l.weight) return c.weight < l.weight ? 1 : -1;
  
  // Se forem do mesmo tipo, compara o índice (ex: rc2 > rc1)
  if (c.suffixIndex !== l.suffixIndex) return c.suffixIndex < l.suffixIndex ? 1 : -1;

  return 0; // Iguais
};
