const mongoose = require('mongoose');
const port = 3000
const app = require('./app');
mongoose.connect('mongodb://localhost/assignment')

mongoose.connection.once('open', () => {
    // console.log('connection established')
}).on('connectionError', (err) => {
    console.log(err);
})

app.listen(port, () => console.log(`Server is running`));