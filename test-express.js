const express = require('express');
const app = express();
app.use((req, res) => {
  res.sendFile('/path/does/not/exist.html');
});
app.listen(3000, () => console.log('Listening'));
