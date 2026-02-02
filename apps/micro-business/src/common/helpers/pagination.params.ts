
export default function getPaginationParams(
  page: number,
  perpage: number,
): { skip?: number; take?: number } {
      return perpage < 0
      ? { skip: undefined, take: undefined }
      : { skip: (page - 1) * perpage, take: perpage };

} 