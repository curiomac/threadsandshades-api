class APIFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  search() {
    const stopwords = ["for", "as", "in", "of"];
    let keywords = this.queryStr.keyword
      ? this.queryStr.keyword.split(",")
      : [];
    keywords = keywords.filter(
      (keyword) => !stopwords.includes(keyword.trim())
    );
    for (let i = keywords.length; i > 0; i--) {
      const subsetKeywords = keywords.slice(0, i);
      const keywordCriteria = {
        product_tags: {
          $all: subsetKeywords.map(
            (keyword) => new RegExp(keyword.trim(), "i")
          ),
        },
      };
      const searchResult = this.query.find(keywordCriteria);
      if (searchResult.length > 0) {
        break;
      }
    }

    return this;
  }

  filter() {
    const excludedFields = ["keyword", "limit", "page"];
    let queryObj = { ...this.queryStr };

    excludedFields.forEach((el) => delete queryObj[el]);

    for (const [key, value] of Object.entries(queryObj)) {
      if (key === "available_sizes") {
        const formated_size_array = value.split(",");
        queryObj[key] = { $elemMatch: { $in: formated_size_array } };
      } else if (key === "target_color_code") {
        console.log("value: ", value);
        const formated_size_array = value.split(",");
        queryObj[key] = { $in: formated_size_array };
      } else if (key === "fixed_price") {
        queryObj[key] = { $gte: value };
      } else {
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
