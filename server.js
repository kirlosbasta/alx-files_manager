import express from 'express';
import router from './routes/index';

const app = express();
const PORT = process.env.PORT || '5000';
app.use(express.json({ limit: '50mb' }));
app.use(router);

app.listen(PORT, () => {
  console.log(`server is connected on port: ${PORT}`);
});
