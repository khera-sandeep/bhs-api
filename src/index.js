const app = require('./app');
const port = process.env.PORT;

try{
  app.listen(port, () => {
    console.log('Server is up on port ' + port);
  });
}catch (e) {
  console.log(e);
}

