-- This SQL script builds a Centsible database, deleting any pre-existing version.

-- @author Alina Sainju

DROP TABLE IF EXISTS TransactionEntry;
DROP TABLE IF EXISTS BudgetSubCategory;
DROP TABLE IF EXISTS BudgetCategory;
DROP TABLE IF EXISTS AppUser;

CREATE TABLE AppUser (
    ID SERIAL PRIMARY KEY,
    firstname VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    passwordhash TEXT NOT NULL,
    joindate DATE NOT NULL DEFAULT CURRENT_DATE,
    currentbalance DECIMAL(15, 2) NOT NULL DEFAULT 0.00
);


CREATE TABLE BudgetCategory (
    ID SERIAL PRIMARY KEY,
    appuserID INT NOT NULL REFERENCES AppUser(ID) ON DELETE CASCADE,
    categoryname VARCHAR(100) NOT NULL,
    monthlydollaramount DECIMAL(15, 2) NOT NULL CHECK (monthlydollaramount >= 0),
    month_ SMALLINT NOT NULL CHECK (month_ BETWEEN 1 AND 12),
    year_ SMALLINT NOT NULL CHECK (year_ >= 2000)
);

CREATE TABLE BudgetSubcategory (
    ID SERIAL PRIMARY KEY,
    budgetcategoryID INT NOT NULL REFERENCES BudgetCategory(ID) ON DELETE CASCADE,
    subcategoryname VARCHAR(100) NOT NULL,
    monthlydollaramount DECIMAL(15, 2) NOT NULL CHECK (monthlydollaramount >= 0)
);

CREATE TABLE TransactionEntry (
    ID SERIAL PRIMARY KEY,
    appuserID INT NOT NULL REFERENCES AppUser(ID) ON DELETE CASCADE,
    dollaramount DECIMAL(15, 2) NOT NULL CHECK (dollaramount != 0),
    transactiontype VARCHAR(50) NOT NULL CHECK (transactiontype IN ('Income', 'Expense')),
    budgetcategoryID INT REFERENCES BudgetCategory(ID) ON DELETE SET NULL,
    optionaldescription VARCHAR(100) NOT NULL DEFAULT '',
    transactiondate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


GRANT SELECT ON AppUser TO PUBLIC;
GRANT SELECT ON BudgetCategory TO PUBLIC;
GRANT SELECT ON BudgetSubCategory TO PUBLIC;
GRANT SELECT ON TransactionEntry TO PUBLIC;


-- Initial Sample Data (Does not reflect everything that is currently in the database)
-- INSERT INTO AppUser(ID, firstname, email, passwordhash) VALUES (1, 'Annie', 'annie_carter@gmail.com', 'annieandbudget');

-- INSERT INTO BudgetCategory(ID, appuserID, categoryname, monthlydollaramount, month_, year_) VALUES (1, 1, 'Education', 580, 12, 2024);
-- INSERT INTO BudgetCategory(ID, appuserID, categoryname, monthlydollaramount, month_, year_) VALUES (2, 1, 'Housing', 30, 12, 2024);
-- INSERT INTO BudgetCategory(ID, appuserID, categoryname, monthlydollaramount, month_, year_) VALUES (3, 1, 'Entertainment', 50, 12, 2024);
-- INSERT INTO BudgetCategory(ID, appuserID, categoryname, monthlydollaramount, month_, year_) VALUES (4, 1, 'Personal', 130, 12, 2024);
-- INSERT INTO BudgetCategory(ID, appuserID, categoryname, monthlydollaramount, month_, year_) VALUES (5, 1, 'Food', 60, 12, 2024);
-- INSERT INTO BudgetCategory(ID, appuserID, categoryname, monthlydollaramount, month_, year_) VALUES (6, 1, 'Transportation', 35, 12, 2024);

-- INSERT INTO BudgetSubCategory(ID, budgetcategoryID, subcategoryname, monthlydollaramount) VALUES (1, 1, 'Books', 200);
-- INSERT INTO BudgetSubCategory(ID, budgetcategoryID, subcategoryname, monthlydollaramount) VALUES (2, 1, 'Stationery', 50);
-- INSERT INTO BudgetSubcategory(ID, budgetcategoryID, subcategoryname, monthlydollaramount) VALUES (3, 1, 'Tuition', 200);
-- INSERT INTO BudgetSubcategory(ID, budgetcategoryID, subcategoryname, monthlydollaramount) VALUES (4, 1, 'Lab Fees', 20);

-- INSERT INTO TransactionEntry(ID, appuserID, dollaramount, transactiontype, budgetcategoryID) VALUES (1,1,14,'Expense', 1);
-- INSERT INTO TransactionEntry(ID, appuserID, dollaramount, transactiontype, budgetcategoryID) VALUES (2,1,5,'Expense', 1);









