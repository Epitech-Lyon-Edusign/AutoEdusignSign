// Import Express using ES Modules syntax
import express from 'express';

// Initialize the application
const app = express();
const PORT = 3000;

// Define a route for the root of the app
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Deployement Successfull`);
});
