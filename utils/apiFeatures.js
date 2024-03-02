class APIFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }
  search() {
    let keyword = this.queryStr.keyword
      ? {
          name: {
            $regex: this.queryStr.keyword,
            $options: "i",
          },
        }
      : {};
    this.query.find({ ...keyword });
    return this;
  }
  filter() {
    const excludedFields = ["keyword", "limit", "page"];
    let queryObj = { ...this.queryStr };

    excludedFields.forEach((el) => delete queryObj[el]);

    for (const [key, value] of Object.entries(queryObj)) {
       if (key === "available_sizes") {
        const formated_size_array = value.split(',')
        queryObj[key] = { $elemMatch: { $in: formated_size_array } };
      } else if (key === "target_color") {
        const formated_size_array = value.split(',')
        queryObj[key] = { $in: formated_size_array };
      } else if (key === "fixed_price") {
        queryObj[key] = { $gte: value };
      }else {
        queryObj[key] = { $eq: value };
      }
    }
    this.query.find(queryObj);
    return this;
  }

  paginate(resPerPage) {
    const currentPage = Number(this.queryStr.page) || 1;
    const skip = resPerPage * (currentPage - 1);
    this.query.limit(resPerPage).skip(skip);
    return this;
  }
}
module.exports = APIFeatures;
