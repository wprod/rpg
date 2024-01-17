export function DictIntersection(dictA: any, dictB: any) {
  const intersection = {};
  for (let k in dictB) {
    if (k in dictA) {
      // @ts-ignore
      intersection[k] = dictA[k];
    }
  }
  return intersection;
}

export function DictDifference(dictA: any, dictB: any) {
  const diff = { ...dictA };
  for (let k in dictB) {
    delete diff[k];
  }
  return diff;
}
