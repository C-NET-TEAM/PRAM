const express = require('express');
const path = require('path');
const app = express();
app.use(express.static(path.join(__dirname, '../dist')));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});
app.listen(3001, () => console.log('Listening'));
