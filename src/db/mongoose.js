const mongoose = require('mongoose');

// mongoose.createConnection(process.env.MONGODB_URL, {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useFindAndModify: false
// }).catch (error => {
//   console.log("Error Connecting Mongo ",error);
// });

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
    }
}

connectDB();

mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

