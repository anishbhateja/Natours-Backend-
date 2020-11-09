class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObject = { ...this.queryString }; //destructing req.query and saving it in queyObject
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach((ele) => {
      delete queryObject[ele];
    });
    //1B) Advanced Filtering
    //?duration[gte]=5 ---->    // {difficulty:'easy', duration:{gte: '5'}}
    // {difficulty:'easy', duration:{$gte:5 }}
    // gte, gt, lte, lt

    let queryStr = JSON.stringify(queryObject);
    queryStr = queryStr.replace(/\b(gte|gt|lt|lte)\b/g, (match) => {
      return `$${match}`;
    });

    this.query = this.query.find(JSON.parse(queryStr)); // this.query=Tour.find()

    return this; //this refers to the entire fatures object
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
      //sort('price ratingsAverage') requires a string which includes space between sorting parameters
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields); //requires a string which includes space between sorting parameters
    } else {
      this.query = this.query.select('-__v'); //send back everthing excluding  __v ('-' deselects the field)
    }
    return this;
  }

  paginate() {
    //page =3, limit =10, page1=1-10,page2=11-20, hence 20 skips required for page 3, skip=(page-1)*limit=(3-1)*10
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    //skip=no of documents to skip from beginning, limit= max no of documents that can be sent
    //if requested page =3, and limit 3, that means documents should start from 7 on page 3 hence skip should be 6
    //skip=(page-1)*limit
    return this;
  }
}

//query.find({filter object}).sort('price ratingsAverage').select('name duration price').skip(2).limit(Adde5)

module.exports = APIFeatures;
