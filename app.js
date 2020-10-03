const fs = require('fs');
const express = require('express');
const app = express();

app.use(express.json()); //middleware, PUTS DATA of incomming request in it's body (req.body)

// app.get('/', (req, res) => {
//   res
//     .status(200)
//     .json({ message: 'Hello from the server side', app: 'Natours' });
// });

// app.post('/', (req, res) => {
//   res.status(200).send('You can post to this end point !');
// });

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`, 'utf-8')
);

//SENDING ALL TOURS
app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

//SENDING PARTICULAR TOUR
app.get('/api/v1/tours/:id', (req, res) => {
  const id = req.params.id * 1; //coverting string into number
  const tour = tours.find((ele) => {
    return ele.id === id;
  });
  //   if (id > tours.length - 1)
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

//ADDING NEW TOUR
app.post('/api/v1/tours', (req, res) => {
  const newId = tours.length;
  const newTour = Object.assign({ id: newId }, req.body); //Object.assign merges 2 object to form 1 new object

  tours.push(newTour);
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  );
});

//UPDATE TOUR
app.patch('/api/v1/tours/:id', (req, res) => {
  const id = req.params.id * 1;
  if (id > tours.length - 1) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: `Tour ${id} updated!`,
    },
  });
});

//DELETE TOUR
app.delete('/api/v1/tours/:id', (req, res) => {
  const id = req.params.id * 1;
  if (id > tours.length - 1) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

const port = 3000;
app.listen(port, () => {
  console.log('App running on port:', port);
});
