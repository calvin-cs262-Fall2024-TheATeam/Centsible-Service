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

router.post('/defaultMonthBudget', createDefaultMonthBudget);
router.get('/monthBudget', readMonthBudget);
router.put('/monthBudget', updateMonthBudget);
router.post('/budgetSubcategory', createSubcategory);
router.get('/budgetSubcategory/:id', readSubcategory);
router.put('/budgetSubcategoryAmount', updateSubcategoryAmount);
router.put('/budgetSubcategoryName', updateSubcategoryName);
router.delete('/budgetSubcategory/:id', deleteSubcategory);

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
  db.oneOrNone('DELETE FROM TransactionEntry WHERE ID=${id} RETURNING id', req.params)
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


// Create default month budget (ie. default categories for a month with default dollar amounts of $0) for a User
// Note: client provides appuserID, month and year
function createDefaultMonthBudget(req, res, next) {
  const categoryList = ['Housing', 'Entertainment', 'Personal', 'Food', 'Transportation'];
  const { appuserID, month, year } = req.body;

  // insertValues is a list of 5 objects with each having the following attributes
  const insertValues = categoryList.map(category => ({
    appuserID,
    categoryname: category,
    monthlydollaramount: 0,
    month,
    year
  }));

  // this ForLoop inserts five rows of default budget categories
  for (const value of insertValues) {
    db.none("INSERT INTO BudgetCategory(appuserID, categoryname, monthlydollaramount, month_, year_) VALUES (${appuserID}, ${category}, ${monthlydollaramount}, ${month}, ${year});", value)
      .then(() => {
        res.sendStatus(201); // Send a 201 Created status code
      })
      .catch((err) => {
        next(err);
      });
  }
}


// Gets budget information of a User for a particular month
function readMonthBudget(req, res, next) {
  db.many('SELECT * FROM BudgetCategory WHERE appuserID=${appuserID} AND month_=${month} AND year_=${year}', req.body)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      next(err);
    });
}


// Updates the monthly dollar amount of a budget category
// Note: 'monthlydollaramount' should be computed on the client side by totalling up the amounts of the subcategories, if they exist
function updateMonthBudget(req, res, next) {
  db.oneOrNone('UPDATE BudgetCategory SET monthlydollaramount=${body.monthlydollaramount} WHERE month_=${month} AND year_=${year} RETURNING id', req.body)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}


// Creates new subcategory with dollar amount for a particular category in the month budget for a User
function createSubcategory(req, res, next) {
  db.one('INSERT INTO BudgetSubcategory(budgetcategoryID, subcategoryname, monthlydollaramount) VALUES (${budgetcategoryID}, ${subcategoryname}, ${monthlydollaramount} RETURNING id', req.body)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      next(err);
    });
}

// Gets all subcategories for a budget category of a User
function readSubcategory(req, res, next) {
  db.many('SELECT * FROM BudgetSubcategory WHERE budgetcategoryID=${budgetcategoryID}', req.params)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      next(err);
    });
}


// Updates the name of Subcategory
function updateSubcategoryName(req, res, next) {
  db.oneOrNone('UPDATE BudgetSubcategory SET subcategoryname=${body.subcategoryname} WHERE ID=${ID} RETURNING id', req.params)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}

// Updates the monthly dollar amount of Subcategory
function updateSubcategoryAmount(req, res, next) {
  db.oneOrNone('UPDATE BudgetSubcategory SET monthlydollaramount=${body.monthlydollaramount} WHERE ID=${ID} RETURNING id', req.params)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}


// Deletes subcategory
function deleteSubcategory(req, res, next) {
  db.oneOrNone('DELETE FROM BudgetSubcategory WHERE ID=${ID} RETURNING id', req.params)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}





























