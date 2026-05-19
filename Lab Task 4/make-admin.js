const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/ebayClone')
    .then(async () => {
        const result = await mongoose.connection.collection('users').updateOne(
            { email: 'admin@mo.com' },
            { $set: { role: 'admin' } }
        );
        console.log(`Matched ${result.matchedCount} document(s) and modified ${result.modifiedCount} document(s).`);
        console.log('User upgraded to admin. You can now log in and access the dashboard.');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
