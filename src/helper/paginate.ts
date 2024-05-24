
export interface  SearchFilter {
    page: number;
    pageSize: number;
    query: object
}

export const paginate = (query: any, { page = 0, pageSize = 10 }: any) => {
    const offset = parseInt(page) * parseInt(pageSize);
    const limit = parseInt(pageSize);
  
    return {
      ...query,
      offset,
      limit,
    };
  };

  export const paginationMapper = (result: any) => {
    let { count,  page, pageSize, rows } = result;
    return {
        pagination: {
          total: count,
          found: rows.length || 0,
          page: parseInt(page || 0),
          pageSize:parseInt(pageSize || 10)
        },
        result:  rows
    };
  };

//   curl -d "page=0&pageSize=10" -X POST http://localhost:2000/employees/search