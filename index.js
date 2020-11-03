const express = require('express');
const hbs = require('express-handlebars');
const mysql = require('mysql2/promise');

port = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3890;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  password: process.env.DB_PASSWORD,
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE || 'leisure',
  connectionLimit: process.env.DB_CONNECTION_LIMIT || 4,
  timezone: '+08:00',
});

// SQL Query String
const SQL_LIST = 'SELECT * FROM TV_SHOWS ORDER BY tvid DESC LIMIT ? OFFSET ?';
const SQL_FIND_BY_TVID = 'SELECT * FROM TV_SHOWS WHERE tvid= ?';
const SQL_LIST_LENGTH = `SELECT COUNT(*) as count FROM TV_SHOWS `;

const app = express();
app.engine('hbs', hbs({ defaultLayout: 'default.hbs' }));
app.set('view engine', 'hbs');

const startApp = async function (app, pool) {
  try {
    const conn = await pool.getConnection();
    console.log('Ping-ing DB');
    await conn.ping();

    app.listen(port, () => console.log(`Running on http://localhost:${port} `));
    await conn.release;
  } catch (err) {
    console.log(`Could not start, ${err}`);
  }
};

app.get('/show/:tvid', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    tvid = req.params.tvid;
    result = await pool.query(SQL_FIND_BY_TVID, [tvid]);
    result = result[0][0];
    res.render('detail', { result });
    await conn.release();
  } catch (err) {
    res.status(500);
    res.send(err);
  }
});

app.get('/', async (req, res) => {
  let limit = 20;
  let nextBtnState = true;
  offset = parseInt(req.query.offset) || 0;
  btnState = req.query.btnState;

  btnState === 'next' ? (offset += 20) : (offset = Math.max(0, offset - 20));

  offset <= 0 ? (prevBtnState = false) : (prevBtnState = true);

  try {
    const conn = await pool.getConnection();
    result = await pool.query(SQL_LIST, [limit, offset]);
    resultLength = await pool.query(SQL_LIST_LENGTH);
    listLength = resultLength[0][0]['count'];
    list = result[0];

    if (offset + limit - listLength >= 0) {
      nextBtnState = false;
    }
    res.render('landing', { list, offset, prevBtnState, nextBtnState });
    await conn.release();
  } catch (err) {
    res.status(500);
    res.send(err);
  }
});

startApp(app, pool);
