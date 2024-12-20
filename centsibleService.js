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

router.post('/registerUser', registerUser);
router.post('/loginUser', loginUser);

router.post('/transactions', createTransaction);
router.get('/transactions/:id', readTransactions);
router.delete('/transactions/:id', deleteTransaction);
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


// Registration API
function registerUser(req, res, next) {
  const { firstname, email, password } = req.body;

  if (!firstname || !email || !password) {
    return res.status(400).json({ message: 'Firstname, email, and password are required.' });
  }

  // Check if the email already exists
  db.manyOrNone('SELECT * FROM AppUser WHERE email = $1', [email])
    .then((data) => {
      if (data && data.length > 0) {
        return res.status(404).json({ message: 'User already exists.' });
      }

      // Hash the password
      return argon2.hash(password)
        .then((hashedPassword) => {
          // Insert user into the database and return the new user's ID
          return db.one(
            'INSERT INTO AppUser (firstname, email, passwordhash) VALUES ($1, $2, $3) RETURNING id',
            [firstname, email, hashedPassword]
          );
        });
    })
    .then((result) => {
      res.status(201).json({ id: result.id, message: 'User registered successfully.' });
    })
    .catch((err) => {
      console.error('Database or hashing error:', err);
      res.status(500).json({ message: 'An internal server error occurred. Please try again later.' });
    });
}


// Login API
function loginUser(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  // Checks if the email exists in the database
  db.one('SELECT * FROM AppUser WHERE email = $1', [email])
    .then((user) => {
      // Compares the provided password with the hashed password stored in the database
      return argon2.verify(user.passwordhash, password)
        .then((isValid) => {
          if (isValid) {
            // Authentication successful
            res.status(200).json({ id: user.id, message: 'User logged in successfully.' });
          } else {
            // Password does not match
            res.status(401).json({ message: 'Invalid email or password.' });
          }
        });
    })
    .catch((err) => {
      console.error('Login error:', err);
      res.status(404).json({ message: 'User not found.' });
    });
}


// Add Transaction for a User
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




























