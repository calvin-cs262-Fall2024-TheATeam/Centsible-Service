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
const argon2 = require('argon2');

router.get('/', readHelloMessage);
router.post('/transactions', createTransaction);
router.get('/transactions/:id', readTransactions);
router.delete('/transactions/:id', deleteTransaction);
// router.put('/transactions/:id', updateTransaction); // Edit Transaction functionality not implemented yet
router.get('/currentBalance/:id', readCurrentBalance);
router.put('/currentBalance', updateCurrentBalance);
router.get('/budgetCategoryName/:id', readBudgetCategoryName);

router.post('/defaultMonthBudget', createDefaultMonthBudget);
router.get('/monthBudget/:appuserID/:month/:year', readMonthBudget);
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
// Note: id + rest of transaction details returned for local storage of transaction details for faster display of view - not necessary to take this approach, but recommended
//       Also returned for PUT/DELETE operation so that the code can refer to the specific transaction
function createTransaction(req, res, next) {
  db.one('INSERT INTO TransactionEntry(appuserID, dollaramount, transactiontype, budgetcategoryID, optionaldescription, transactiondate) VALUES (${appuserID}, ${dollaramount}, ${transactiontype}, ${budgetcategoryID}, ${optionaldescription}, ${transactiondate}) RETURNING id', req.body)
    .then((data) => {
      const responseBody = { id: data.id, ...req.body };
      res.send(responseBody);
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
  db.oneOrNone('UPDATE AppUser SET currentbalance=${newbalance} WHERE ID=${id} RETURNING id', req.body)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}


// Reads the budget category name given the ID of the budgetCategory
function readBudgetCategoryName(req, res, next) {
  db.one('SELECT categoryname FROM BudgetCategory WHERE ID=${id}', req.params)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      next(err);
    });
}


// Create default month budget (ie. default categories for a month with default dollar amounts of $0) for a User
// Note: client provides appuserID, month and year
function createDefaultMonthBudget(req, res, next) {
  const categoryList = ['Housing', 'Entertainment', 'Personal', 'Food', 'Transportation', 'Education'];
  const { appuserID, month, year } = req.body;

  // insertValues is a list of 6 objects with each having the following attributes
  const insertValues = categoryList.map(category => ({
    appuserID,
    categoryname: category,
    monthlydollaramount: 0,
    month,
    year
  }));

  // batch inserts
  const queries = insertValues.map(value =>
    db.none(
      "INSERT INTO BudgetCategory(appuserID, categoryname, monthlydollaramount, month_, year_) VALUES (${appuserID}, ${categoryname}, ${monthlydollaramount}, ${month}, ${year});",
      value
    )
  );

  Promise.all(queries) // wait for all the inserts to be finished
    .then(() => {
      res.sendStatus(201); // send success response after all inserts complete
    })
    .catch(err => {
      next(err);
    });
}



// Gets budget information of a User for a particular month
// function readMonthBudget(req, res, next) {
//   const { appuserID, month, year } = req.params;

//   db.many('SELECT * FROM BudgetCategory WHERE appuserID=${appuserID} AND month_=${month} AND year_=${year}', {
//     appuserID,
//     month,
//     year
//   })
//     .then((data) => {
//       res.send(data);
//     })
//     .catch((err) => {
//       next(err);
//     });
// }


// Gets budget information of a User for a particular month
function readMonthBudget(req, res, next) {
  const { appuserID, month, year } = req.params;

  db.manyOrNone('SELECT * FROM BudgetCategory WHERE appuserID=${appuserID} AND month_=${month} AND year_=${year}', {
    appuserID,
    month,
    year
  })
    .then((data) => {
      if (data && data.length > 0) {
        // Data exists
        res.send({
          success: true,
          message: 'Budget data retrieved successfully',
          data,
        });
      } else {
        // No data found
        res.status(404).send({
          success: false,
          message: 'No budget data found for the specified user and date',
        });
      }
    })
    .catch((err) => {
      // Server error
      console.error('Error querying database:', err);
      res.status(500).send({
        success: false,
        message: 'An internal server error occurred. Please try again later.',
      });
    });
}


// Updates the monthly dollar amount of a budget category
// Note: 'monthlydollaramount' should be computed on the client side by totalling up the amounts of the subcategories, if they exist
function updateMonthBudget(req, res, next) {
  db.oneOrNone('UPDATE BudgetCategory SET monthlydollaramount=${monthlydollaramount} WHERE month_=${month} AND year_=${year} RETURNING id', req.body)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}


// Creates new subcategory with dollar amount for a particular category in the month budget for a User
function createSubcategory(req, res, next) {
  db.one('INSERT INTO BudgetSubcategory(budgetcategoryID, subcategoryname, monthlydollaramount) VALUES (${budgetcategoryID}, ${subcategoryname}, ${monthlydollaramount}) RETURNING id', req.body)
    .then((data) => {
      const responseBody = { id: data.id, ...req.body };
      res.send(responseBody);
    })
    .catch((err) => {
      next(err);
    });
}

// Gets all subcategories for a budget category of a User
// function readSubcategory(req, res, next) {
//   db.many('SELECT * FROM BudgetSubcategory WHERE budgetcategoryID=${id}', req.params)
//     .then((data) => {
//       res.send(data);
//     })
//     .catch((err) => {
//       next(err);
//     });
// }

// Gets all subcategories for a budget category of a User
function readSubcategory(req, res, next) {
  const { id } = req.params;

  db.manyOrNone('SELECT * FROM BudgetSubcategory WHERE budgetcategoryID=${id}', { id })
    .then((data) => {
      if (data && data.length > 0) {
        // Subcategories found
        res.send({
          success: true,
          message: 'Subcategories retrieved successfully',
          data,
        });
      } else {
        // No subcategories found
        res.status(404).send({
          success: false,
          message: 'No subcategories found for the specified budget category',
        });
      }
    })
    .catch((err) => {
      // Server error
      console.error('Error querying database:', err);
      res.status(500).send({
        success: false,
        message: 'An internal server error occurred. Please try again later.',
      });
    });
}



// Updates the name of Subcategory
function updateSubcategoryName(req, res, next) {
  db.oneOrNone('UPDATE BudgetSubcategory SET subcategoryname=${subcategoryname} WHERE ID=${id} RETURNING id', req.body)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}

// Updates the monthly dollar amount of Subcategory
function updateSubcategoryAmount(req, res, next) {
  db.oneOrNone('UPDATE BudgetSubcategory SET monthlydollaramount=${monthlydollaramount} WHERE ID=${id} RETURNING id', req.body)
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


























