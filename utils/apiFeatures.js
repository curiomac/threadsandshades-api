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

    console.log("Original query object:", queryObj);

    excludedFields.forEach((el) => delete queryObj[el]);

    for (const [key, value] of Object.entries(queryObj)) {
      if (key === "available_sizes" && typeof value === "string") {
        console.log("Value:", value);
        const sizesArray = value.split(",").map((size) => size.trim());
        console.log("sizesArray: ", sizesArray);
        queryObj[key] = { $all: sizesArray };
      } else {
        queryObj[key] = { $eq: value };
      }
    }
    console.log("Updated query object:", queryObj);

    console.log("MongoDB Query:", this.query.getFilter());
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
