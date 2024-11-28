// Set up the database connection.

const pgp = require('pg-promise')();

const db = pgp({
  host: process.env.DB_SERVER,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Configure the server and its routes.
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;
const router = express.Router();
router.use(express.json());

router.get('/', readHelloMessage);
router.post('/transactions', createTransaction);
router.get('/transactions/:id', readTransactions);
router.delete('/transactions/:id', deleteTransaction);
// router.put('/transactions/:id', updateTransaction); // Edit Transaction functionality not implemented yet
router.get('/currentBalance/:id', readCurrentBalance);
router.put('/currentBalance/:id', updateCurrentBalance);

app.use(router);
app.listen(port, () => console.log(`Listening on port ${port}`));


// Implement the CRUD operations.

function returnDataOr404(res, data) {
  if (data == null) {
    res.sendStatus(404);
  } else {
    res.send(data);
  }
}


function readHelloMessage(req, res) {
  res.send('Hello, Centsible Service!');
}


// Add Transaction for a User
// Note: id returned for local storage of transaction details for faster display of view - not necessary to take this approach, but recommended
//       Also returned for PUT/DELETE operation so that the code can refer to the specific transaction
function createTransaction(req, res, next) {
  db.one('INSERT INTO TransactionEntry(appuserID, dollaramount, transactiontype, budgetcategoryID, optionaldescription, transactiondate) VALUES (${appuserID}, ${dollaramount}, ${transactiontype}, ${budgetcategoryID}, ${optionaldescription}, ${transactiondate}) RETURNING id', req.body)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      next(err);
    });
}


// Get Transactions of a User
function readTransactions(req, res, next) {
  db.many('SELECT * FROM TransactionEntry WHERE appuserID=${id}', req.params)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      next(err);
    });
}

// Delete Transaction of a User
function deleteTransaction(req, res, next) {
  db.oneOrNone('DELETE FROM TransactionEntry WHERE ID=${id}', req.params)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}


// Get Current Balance of a User
function readCurrentBalance(req, res, next) {
  db.many('SELECT currentbalance FROM AppUser WHERE ID=${id}', req.params)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      next(err);
    });
}


// Update Current Balance of a User based on new added transactions
// Note: 'newbalance' should be computed on the client side
function updateCurrentBalance(req, res, next) {
  db.oneOrNone('UPDATE AppUser SET currentbalance=${body.newbalance} WHERE ID=${id} RETURNING id', req.params)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}



























